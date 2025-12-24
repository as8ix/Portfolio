import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../App';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import About from '../components/About';
import Traits from '../components/Traits';
import { content } from '../data/content';
import { db } from '../firebase';
import { doc, updateDoc, increment, setDoc, getDoc } from 'firebase/firestore';

export default function Home() {
    const { lang, setLang } = useAuth();

    useEffect(() => {
        const trackVisit = async () => {
            const hasVisitedSession = sessionStorage.getItem('hasVisitedSession');
            const visitorId = localStorage.getItem('visitorId');

            try {
                const statsRef = doc(db, "analytics", "site_stats");
                const statsSnap = await getDoc(statsRef);

                let updates = {};

                // 1. Handle Total Sessions (Once per session)
                if (!hasVisitedSession) {
                    updates.visits = increment(1);
                    sessionStorage.setItem('hasVisitedSession', 'true');
                }

                // 2. Handle Unique Visitors (Once per browser/identity)
                if (!visitorId) {
                    const newVisitorId = crypto.randomUUID();
                    localStorage.setItem('visitorId', newVisitorId);
                    updates.uniqueVisitors = increment(1);
                }

                // Apply updates if any
                if (Object.keys(updates).length > 0) {
                    if (!statsSnap.exists()) {
                        await setDoc(statsRef, {
                            visits: updates.visits ? 1 : 0,
                            uniqueVisitors: updates.uniqueVisitors ? 1 : 0
                        });
                    } else {
                        await updateDoc(statsRef, updates);
                    }
                }
            } catch (error) {
                console.error("Error tracking visit:", error);
            }
        };

        trackVisit();
    }, [lang]); // Re-run when language changes to ensure it stays in the footer if the component re-renders completely

    const t = content[lang];

    return (
        <div className={`min-h-screen ${lang === 'ar' ? 'font-arabic' : 'font-english'} bg-white dark:bg-[#0a0a0a] text-black dark:text-white selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black pt-20 transition-colors duration-300`}>
            <Navbar lang={lang} setLang={setLang} />
            <main>
                <Hero lang={lang} />
                <About lang={lang} />
                <Traits lang={lang} />
            </main>
            <footer id="contact" className="py-20 text-center border-t border-gray-100 dark:border-white/5 relative overflow-hidden transition-colors duration-500">
                {/* Footer Background Glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-600/5 blur-[100px] -z-10"></div>

                <div className="max-w-7xl mx-auto px-6">
                    <h2 className="text-2xl font-black mb-8 tracking-tighter dark:text-white uppercase">{t.contact}</h2>

                    {/* Contact Links (Refined & Smaller) */}
                    <div className="mb-8 flex flex-wrap justify-center gap-4">
                        {/* Phone */}
                        <a
                            href={`tel:${t.phone.replace(/\s+/g, '')}`}
                            className="p-3.5 rounded-xl bg-blue-600/10 border border-blue-600/20 text-blue-600 hover:bg-blue-600 hover:text-white transition-all transform hover:-translate-y-1 shadow-lg shadow-blue-600/5"
                            aria-label="Call Me"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                        </a>

                        {/* GitHub */}
                        <a href={t.socials.github} target="_blank" rel="noopener noreferrer" className="p-3.5 rounded-xl bg-gray-50 dark:bg-zinc-900 border border-gray-100 dark:border-white/5 text-gray-400 hover:text-black dark:hover:text-white hover:border-black/30 transition-all transform hover:-translate-y-1 shadow-sm" aria-label="GitHub">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.042-1.416-4.042-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                            </svg>
                        </a>

                        {/* X */}
                        <a href={t.socials.x} target="_blank" rel="noopener noreferrer" className="p-3.5 rounded-xl bg-gray-50 dark:bg-zinc-900 border border-gray-100 dark:border-white/5 text-gray-400 hover:text-black dark:hover:text-white hover:border-black/30 transition-all transform hover:-translate-y-1 shadow-sm" aria-label="X (Twitter)">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.451-6.231zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
                            </svg>
                        </a>

                        {/* Instagram */}
                        <a href={t.socials.instagram} target="_blank" rel="noopener noreferrer" className="p-3.5 rounded-xl bg-gray-50 dark:bg-zinc-900 border border-gray-100 dark:border-white/5 text-gray-400 hover:text-pink-600 hover:border-pink-600/30 transition-all transform hover:-translate-y-1 shadow-sm" aria-label="Instagram">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" strokeWidth="2.5" />
                                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" strokeWidth="2.5" />
                                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" strokeWidth="2.5" />
                            </svg>
                        </a>

                    </div>

                    {/* Direct Buy Me a Coffee Button */}
                    <div className="mb-12 flex justify-center transform hover:scale-105 transition-transform">
                        <a href="https://www.buymeacoffee.com/abdallaashm" target="_blank" rel="noopener noreferrer">
                            <img
                                src="https://img.buymeacoffee.com/button-api/?text=Buy me a coffee&emoji=☕&slug=abdallaashm&button_colour=5F7FFF&font_colour=ffffff&font_family=Cookie&outline_colour=000000&coffee_colour=FFDD00"
                                alt="Buy me a coffee"
                                className="h-10 md:h-12"
                            />
                        </a>
                    </div>

                    <div className="space-y-4">
                        <p className="text-gray-400 dark:text-gray-600 text-[10px] md:text-sm uppercase tracking-[0.3em]">{t.footer}</p>
                        <div className="flex justify-center gap-8 text-[10px] md:text-xs font-bold uppercase tracking-widest">
                            <Link to="/privacy" className="text-gray-400 hover:text-black dark:hover:text-white transition-colors">{t.privacyLinks.privacy}</Link>
                            <Link to="/terms" className="text-gray-400 hover:text-black dark:hover:text-white transition-colors">{t.privacyLinks.terms}</Link>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
