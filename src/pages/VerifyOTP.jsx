import { useState, useEffect, useRef } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { db, auth } from '../firebase';
import { collection, query, where, getDocs, deleteDoc, doc, limit } from 'firebase/firestore';

export default function VerifyOTP() {
    const { user: contextUser, loading, isMfaVerified, setIsMfaVerified } = useAuth();
    // Fallback to direct Firebase auth state to avoid context race conditions
    const user = contextUser || auth.currentUser;

    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [error, setError] = useState('');
    const [loadingAction, setLoadingAction] = useState(false);
    const inputRefs = useRef([]);
    const navigate = useNavigate();

    useEffect(() => {
        console.log("VerifyOTP Auth State:", {
            contextUser: contextUser?.email,
            directUser: auth.currentUser?.email,
            loading,
            isMfaVerified
        });

        // Auto-focus first input
        if (inputRefs.current[0]) inputRefs.current[0].focus();
    }, [contextUser, loading]);

    // Important: Wait for Auth to finish loading before redirecting
    if (loading && !user) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#060606]">
            <div className="w-8 h-8 border-4 border-zinc-900 dark:border-white border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    // If still no user after loading, then and only then redirect
    if (!loading && !user) {
        console.warn("No user found in VerifyOTP, redirecting to login...");
        return <Navigate to="/login" replace />;
    }

    if (isMfaVerified) return <Navigate to="/admin" replace />;

    const handlePaste = (e) => {
        const data = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (!data) return;

        const newOtp = data.split('').concat(Array(6 - data.length).fill('')).slice(0, 6);
        setOtp(newOtp);

        // Auto-submit if 6 digits
        if (data.length === 6) {
            handleVerify(null, data);
        } else {
            // Focus the first empty slot
            inputRefs.current[data.length].focus();
        }
    };

    const handleChange = (element, index) => {
        if (isNaN(element.value)) return false;

        const newOtp = [...otp.map((d, idx) => (idx === index ? element.value : d))];
        setOtp(newOtp);

        // Focus next input
        if (element.value !== '' && index < 5) {
            inputRefs.current[index + 1].focus();
        }

        // Automatic Submission: if all 6 digits are filled
        if (newOtp.every(v => v !== '') && newOtp.join('').length === 6) {
            handleVerify(null, newOtp.join(''));
        }
    };

    const handleKeyDown = (e, index) => {
        if (e.key === 'Backspace' && index > 0 && otp[index] === '') {
            inputRefs.current[index - 1].focus();
        }
    };

    const handleVerify = async (e, forcedOtp = null) => {
        if (e) e.preventDefault();
        const fullOtp = forcedOtp || otp.join('');
        if (fullOtp.length !== 6) return setError('Please enter the full 6-digit code.');

        setLoadingAction(true);
        setError('');

        try {
            // Check Firestore for valid OTP for this user
            const q = query(
                collection(db, "otps"),
                where("email", "==", user.email),
                where("code", "==", fullOtp),
                limit(1)
            );

            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                // Check if expired (e.g., within 10 minutes)
                const otpDoc = querySnapshot.docs[0];
                const createdAt = otpDoc.data().createdAt?.toDate();
                const now = new Date();
                const diff = (now - createdAt) / 1000 / 60; // diff in minutes

                if (diff > 10) {
                    setError('Code expired. Please login again.');
                } else {
                    // Success! 
                    setIsMfaVerified(true);
                    // Clean up: Delete the used OTP
                    await deleteDoc(doc(db, "otps", otpDoc.id));
                    navigate('/admin');
                }
            } else {
                setError('Invalid verification code.');
            }
        } catch (err) {
            console.error(err);
            setError('Verification failed. Try again.');
        } finally {
            setLoadingAction(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#060606] transition-colors duration-300 p-6">
            <div className="max-w-[440px] w-full bg-white dark:bg-zinc-900 p-10 rounded-[40px] shadow-2xl shadow-black/5 border border-gray-100 dark:border-zinc-800 flex flex-col items-center">

                {/* Shield Icon Header */}
                <div className="w-16 h-16 bg-zinc-900 dark:bg-zinc-800 rounded-2xl flex items-center justify-center mb-8 shadow-xl shadow-black/10">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                </div>

                <h2 className="text-2xl font-bold mb-2 dark:text-white text-center">Verify it's you</h2>
                <p className="text-gray-400 dark:text-zinc-500 text-center text-[15px] mb-8 leading-relaxed">
                    We've sent a 6-digit code to <span className="text-zinc-900 dark:text-gray-200 font-bold">{user?.email}</span>.
                </p>

                {error && (
                    <div className="w-full mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-2xl text-[14px] text-center font-medium border border-red-100 dark:border-red-800/30">
                        {error}
                    </div>
                )}

                <form onSubmit={handleVerify} className="w-full flex flex-col items-center">
                    <div className="flex gap-2 sm:gap-3 mb-10" dir="ltr">
                        {otp.map((data, index) => (
                            <input
                                key={index}
                                type="text"
                                maxLength="1"
                                ref={(el) => (inputRefs.current[index] = el)}
                                value={data}
                                onChange={(e) => handleChange(e.target, index)}
                                onKeyDown={(e) => handleKeyDown(e, index)}
                                onPaste={handlePaste}
                                className="w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-bold rounded-2xl bg-gray-50 dark:bg-zinc-800/50 border-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white dark:text-white outline-none transition-all shadow-sm"
                            />
                        ))}
                    </div>

                    <button
                        type="submit"
                        disabled={loadingAction}
                        className="w-full bg-zinc-900 dark:bg-white dark:text-black text-white py-4 px-6 rounded-2xl font-bold text-[15px] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100 shadow-xl shadow-black/10 dark:shadow-white/10"
                    >
                        {loadingAction ? 'Verifying...' : 'Complete Sign In'}
                    </button>

                    <button
                        type="button"
                        onClick={() => navigate('/login')}
                        className="mt-6 text-gray-400 hover:text-zinc-900 dark:hover:text-white text-sm font-medium transition-colors"
                    >
                        Use a different account
                    </button>
                </form>
            </div>
        </div>
    );
}
