import { useState } from 'react';
import { auth, db } from '../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { collection, addDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import emailjs from '@emailjs/browser';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState(''); // 'verifying', 'generating', 'sending', 'redirecting'
    const navigate = useNavigate();

    const generateOTP = () => {
        return Math.floor(100000 + Math.random() * 900000).toString();
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Phase 1: Email/Password
            setStatus('verifying');
            await signInWithEmailAndPassword(auth, email, password);

            // Phase 2: Generate unique 6-digit OTP
            setStatus('generating');
            const otpCode = generateOTP();

            // Phase 3: Store OTP with 5s Timeout (prevents infinite hang)
            const storeOTP = async () => {
                await addDoc(collection(db, "otps"), {
                    email,
                    code: otpCode,
                    createdAt: new Date()
                });
            };

            const timeout = (ms) => new Promise((_, reject) =>
                setTimeout(() => reject(new Error('timeout')), ms)
            );

            try {
                // Wait max 10 seconds for Firestore (more resilient to slow rules/network)
                await Promise.race([storeOTP(), timeout(10000)]);

                // Phase 4: Send Actual Email via EmailJS
                // Phase 4: Send Actual Email via EmailJS
                setStatus('sending');

                await emailjs.send('service_010hqp8', 'template_lfkek8r', {
                    to_email: email,
                    otp_code: otpCode
                }, 'user_yvRkJn8pC4MS00L30KPJa');

                window.sessionStorage.setItem('lastOtp', otpCode);
                setStatus('redirecting');
                navigate('/verify-otp');
            } catch (mfaErr) {
                console.error("CRITICAL MFA FAILURE:", mfaErr);
                // SHOW RAW ERROR TO USER FOR DEBUGGING
                const errorMsg = mfaErr.text || mfaErr.message || JSON.stringify(mfaErr);
                setError(`Security failure: ${errorMsg}`);
            }
        } catch (authErr) {
            console.error("CRITICAL AUTH FAILURE:", authErr);
            if (authErr.code === 'auth/invalid-credential') {
                setError('Invalid email or password.');
            } else {
                setError(`Login error: ${authErr.message}`);
            }
        } finally {
            setLoading(false);
            setStatus('');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#060606] transition-colors duration-300 p-6">
            <div className="max-w-[440px] w-full bg-white dark:bg-zinc-900 p-10 rounded-[40px] shadow-2xl shadow-black/5 dark:shadow-none border border-gray-100 dark:border-zinc-800 flex flex-col items-center">

                {/* Grid Icon Header */}
                <div className="w-16 h-16 bg-zinc-900 dark:bg-zinc-800 rounded-2xl flex items-center justify-center mb-8 shadow-xl shadow-black/10">
                    <div className="grid grid-cols-3 gap-1">
                        {[...Array(9)].map((_, i) => (
                            <div key={i} className="w-1.5 h-1.5 bg-zinc-400 rounded-full"></div>
                        ))}
                    </div>
                </div>

                <h2 className="text-2xl font-bold mb-2 dark:text-white text-center">Sign in to continue</h2>
                <p className="text-gray-400 dark:text-zinc-500 text-center text-[15px] mb-10 leading-relaxed">
                    Please enter your credentials to access the admin dashboard.
                </p>

                {error && (
                    <div className="w-full mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-2xl text-[14px] text-center font-medium border border-red-100 dark:border-red-800/30">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="w-full space-y-4">
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                            <svg className="w-5 h-5 text-gray-400 group-focus-within:text-zinc-900 dark:group-focus-within:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full pl-14 pr-6 py-4 bg-gray-50 dark:bg-zinc-800/50 border-none rounded-2xl focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white outline-none dark:text-white text-[15px] placeholder:text-gray-400 transition-all font-medium"
                            placeholder="Email Address"
                        />
                    </div>

                    <div className="relative group">
                        <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                            <svg className="w-5 h-5 text-gray-400 group-focus-within:text-zinc-900 dark:group-focus-within:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <input
                            type={showPassword ? "text" : "password"}
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full pl-14 pr-12 py-4 bg-gray-50 dark:bg-zinc-800/50 border-none rounded-2xl focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white outline-none dark:text-white text-[15px] placeholder:text-gray-400 transition-all font-medium"
                            placeholder="Password"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-5 flex items-center text-gray-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
                        >
                            {showPassword ? (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                            ) : (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" /></svg>
                            )}
                        </button>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-zinc-900 dark:bg-white dark:text-black text-white py-4 px-6 rounded-2xl font-bold text-[15px] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100 shadow-xl shadow-black/10 dark:shadow-white/10 mt-2"
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                                {status === 'verifying' ? 'Verifying...' :
                                    status === 'generating' ? 'Generating Code...' :
                                        status === 'sending' ? 'Sending Code...' :
                                            status === 'redirecting' ? 'Redirecting...' : 'Signing In...'}
                            </span>
                        ) : 'Sign In'}
                    </button>
                </form>

                <div className="w-full mt-10 relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-100 dark:border-zinc-800"></div>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-white dark:bg-zinc-900 px-4 text-gray-400 dark:text-zinc-600 font-bold tracking-widest">Or continue with</span>
                    </div>
                </div>

                {/* Social Login Placeholders */}
                <div className="w-full flex gap-4 mt-8">
                    {[
                        { icon: 'https://www.svgrepo.com/show/475656/google-color.svg', label: 'Google' },
                        { icon: 'https://www.svgrepo.com/show/475647/facebook-color.svg', label: 'Facebook' },
                        { icon: 'https://www.svgrepo.com/show/445327/apple-logo.svg', label: 'Apple' }
                    ].map((platform, i) => (
                        <button key={i} className="flex-1 py-3.5 border border-gray-100 dark:border-zinc-800 rounded-2xl flex items-center justify-center hover:bg-gray-50 dark:hover:bg-zinc-800 transition-all group">
                            <img src={platform.icon} alt={platform.label} className="w-5 h-5 opacity-80 group-hover:opacity-100" />
                        </button>
                    ))}
                </div>

                <div className="mt-12 text-sm text-gray-400 dark:text-zinc-600 font-medium">
                    Don't have an account? <span className="text-zinc-900 dark:text-white cursor-pointer hover:underline">Sign Up</span>
                </div>
            </div>
        </div>
    );
}
