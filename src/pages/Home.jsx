import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import About from '../components/About';
import Traits from '../components/Traits';
import { content } from '../data/content';
import { db } from '../firebase';
import { doc, updateDoc, increment, setDoc, getDoc } from 'firebase/firestore';

export default function Home() {
    const [lang, setLang] = useState('ar');

    useEffect(() => {
        document.documentElement.lang = lang;
        document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    }, [lang]);

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
    }, []);

    const t = content[lang];

    return (
        <div className={`min-h-screen ${lang === 'ar' ? 'font-arabic' : 'font-english'} bg-white dark:bg-[#0a0a0a] text-black dark:text-white selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black pt-20 transition-colors duration-300`}>
            <Navbar lang={lang} setLang={setLang} />
            <main>
                <Hero lang={lang} />
                <About lang={lang} />
                <Traits lang={lang} />
            </main>
            <footer className="py-12 text-center text-gray-400 dark:text-gray-600 text-sm uppercase tracking-widest border-t border-gray-100 dark:border-white/5">
                <p className="mb-4">{t.footer}</p>
                <div className="flex justify-center gap-6 text-[10px] sm:text-xs">
                    <Link to="/privacy" className="hover:text-black dark:hover:text-white transition-colors">{t.privacyLinks.privacy}</Link>
                    <Link to="/terms" className="hover:text-black dark:hover:text-white transition-colors">{t.privacyLinks.terms}</Link>
                </div>
            </footer>
        </div>
    );
}
