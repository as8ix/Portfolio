import { useState, useRef } from 'react';
import emailjs from '@emailjs/browser';
import Navbar from '../components/Navbar';
import { useAuth } from '../App';
import { content } from '../data/content';
import { Link } from 'react-router-dom';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';

export default function Contact() {
    const { lang, setLang } = useAuth();
    const t = content[lang];
    const cp = t.contactPage;

    const form = useRef();
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState(null); // 'success', 'error'

    const sendEmail = async (e) => {
        e.preventDefault();

        // Simple Honeypot check
        if (e.target.bot_field.value) {
            console.warn("Bot detected.");
            return;
        }

        setLoading(true);
        setStatus(null);

        const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
        const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
        const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

        // Form Data for Firestore backup
        const formData = {
            user_name: e.target.user_name.value,
            user_email: e.target.user_email.value,
            message: e.target.message.value,
            createdAt: new Date(),
            lang: lang
        };

        try {
            // 1. Save to Firestore (Database Backup)
            // This collection name must match what we fetch in AdminDashboard
            await addDoc(collection(db, "messages"), formData);
            console.log("Message saved to Firestore");

            // 2. Try to send via EmailJS (Notification)
            if (serviceId && templateId && publicKey) {
                try {
                    await emailjs.sendForm(serviceId, templateId, form.current, publicKey);
                } catch (emailError) {
                    console.warn("EmailJS failed, but message was saved to database:", emailError);
                }
            } else {
                console.warn("EmailJS keys missing - message only saved to database.");
            }

            // If we reached here, Firestore at least worked
            setStatus('success');
            form.current.reset();
        } catch (error) {
            console.error("Contact Form Error:", error);
            setStatus('error'); // This will show the red error message
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`min-h-screen ${lang === 'ar' ? 'font-arabic' : 'font-english'} bg-white dark:bg-[#0a0a0a] text-black dark:text-white transition-colors duration-500 overflow-hidden pt-20`}>
            {/* Background Glows */}
            <div className="rich-glow w-[600px] h-[600px] bg-blue-600/5 -top-20 -right-20 animate-float"></div>
            <div className="rich-glow w-[500px] h-[500px] bg-purple-600/5 -bottom-20 -left-20 animate-float delay-500"></div>

            <Navbar lang={lang} setLang={setLang} />

            <main className="max-w-7xl mx-auto px-6 py-20 relative z-10">
                <div className="text-center mb-20 animate-fade-in-up">
                    <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-6 bg-gradient-to-b from-black to-gray-400 dark:from-white dark:to-zinc-800 bg-clip-text text-transparent">
                        {cp.title}
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 text-lg md:text-xl font-medium max-w-2xl mx-auto">
                        {cp.subtitle}
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                    {/* Contact Form Section */}
                    <div className="premium-card p-10 md:p-12 animate-fade-in-up delay-200">
                        <form ref={form} onSubmit={sendEmail} className="space-y-8">
                            {/* Honeypot */}
                            <input type="text" name="bot_field" style={{ display: 'none' }} />

                            <div className="space-y-2">
                                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-4">{cp.name}</label>
                                <input
                                    type="text"
                                    name="user_name"
                                    required
                                    className="w-full px-8 py-4 bg-gray-50 dark:bg-zinc-800/50 border-none rounded-2xl focus:ring-2 focus:ring-blue-600 outline-none dark:text-white font-medium placeholder:text-gray-400 transition-all shadow-inner"
                                    placeholder={cp.name}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-4">{cp.email}</label>
                                <input
                                    type="email"
                                    name="user_email"
                                    required
                                    className="w-full px-8 py-4 bg-gray-50 dark:bg-zinc-800/50 border-none rounded-2xl focus:ring-2 focus:ring-blue-600 outline-none dark:text-white font-medium placeholder:text-gray-400 transition-all shadow-inner"
                                    placeholder={cp.email}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-4">{cp.message}</label>
                                <textarea
                                    name="message"
                                    required
                                    rows="6"
                                    className="w-full px-8 py-6 bg-gray-50 dark:bg-zinc-800/50 border-none rounded-[32px] focus:ring-2 focus:ring-blue-600 outline-none dark:text-white font-medium placeholder:text-gray-400 transition-all shadow-inner resize-none"
                                    placeholder={cp.message}
                                ></textarea>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white font-black tracking-widest uppercase text-sm rounded-2xl transition-all transform hover:scale-[1.01] active:scale-[0.99] shadow-2xl shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Sending...' : cp.send}
                            </button>

                            {status === 'success' && (
                                <p className="text-green-600 font-bold text-center animate-pulse">{cp.success}</p>
                            )}
                            {status === 'error' && (
                                <p className="text-red-600 font-bold text-center animate-pulse">{cp.error}</p>
                            )}
                        </form>
                    </div>

                    {/* Info Section */}
                    <div className="lg:pl-12 space-y-12 animate-fade-in-up delay-300">
                        {/* Contact Info Cards */}
                        <div className="space-y-6">
                            <h2 className="text-2xl font-black tracking-tight">{cp.infoTitle}</h2>

                            <div className="flex items-center gap-6 p-6 glass rounded-[32px]">
                                <div className="w-12 h-12 bg-blue-600/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{cp.phone}</p>
                                    <a href={`tel:${t.phone.replace(/\s+/g, '')}`} className="text-xl font-bold hover:text-blue-600 transition-colors">{t.phone}</a>
                                </div>
                            </div>

                            <div className="flex items-center gap-6 p-6 glass rounded-[32px]">
                                <div className="w-12 h-12 bg-purple-600/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{cp.location}</p>
                                    <p className="text-xl font-bold">{cp.locationVal}</p>
                                </div>
                            </div>
                        </div>

                        {/* Social Links */}
                        <div className="space-y-6">
                            <h2 className="text-x font-bold text-gray-400 uppercase tracking-[0.3em]">Follow Me</h2>
                            <div className="flex gap-4">
                                <a href={t.socials.github} target="_blank" rel="noopener noreferrer" className="w-14 h-14 glass rounded-2xl flex items-center justify-center text-gray-400 hover:text-black dark:hover:text-white transition-all transform hover:-translate-y-1">
                                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.042-1.416-4.042-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg>
                                </a>
                                <a href={t.socials.x} target="_blank" rel="noopener noreferrer" className="w-14 h-14 glass rounded-2xl flex items-center justify-center text-gray-400 hover:text-black dark:hover:text-white transition-all transform hover:-translate-y-1">
                                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.451-6.231zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" /></svg>
                                </a>
                                <a href={t.socials.instagram} target="_blank" rel="noopener noreferrer" className="w-14 h-14 glass rounded-2xl flex items-center justify-center text-gray-400 hover:text-pink-600 transition-all transform hover:-translate-y-1">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" strokeWidth="2.5" />
                                        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" strokeWidth="2.5" />
                                        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" strokeWidth="2.5" />
                                    </svg>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer Copy */}
            <footer className="py-12 text-center border-t border-gray-100 dark:border-white/5 relative z-10">
                <p className="text-gray-400 dark:text-gray-600 text-[10px] md:text-sm uppercase tracking-[0.3em] font-bold">{t.footer}</p>
                <div className="flex justify-center gap-8 text-[10px] md:text-xs font-bold uppercase tracking-widest mt-4">
                    <Link to="/privacy" className="text-gray-400 hover:text-black dark:hover:text-white transition-colors">{t.privacyLinks.privacy}</Link>
                    <Link to="/terms" className="text-gray-400 hover:text-black dark:hover:text-white transition-colors">{t.privacyLinks.terms}</Link>
                </div>
            </footer>
        </div>
    );
}
