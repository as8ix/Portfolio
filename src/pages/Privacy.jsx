import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { content } from '../data/content';

export default function Privacy() {
    const [lang, setLang] = useState(localStorage.getItem('lang') || 'ar');

    useEffect(() => {
        document.documentElement.lang = lang;
        document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
        localStorage.setItem('lang', lang);
    }, [lang]);

    const t = content[lang];

    return (
        <div className={`min-h-screen ${lang === 'ar' ? 'font-arabic' : 'font-english'} bg-white dark:bg-[#060606] text-black dark:text-white pt-32 pb-20 transition-colors duration-300`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            <Navbar lang={lang} setLang={setLang} />
            <div className="max-w-7xl mx-auto px-6 md:px-20">
                <h1 className="text-4xl sm:text-7xl font-black mb-12 tracking-tighter animate-fade-in-up">{t.privacyTitle}</h1>
                <div className="prose dark:prose-invert max-w-none text-lg leading-relaxed text-gray-700 dark:text-gray-300 whitespace-pre-line animate-fade-in-up delay-100">
                    {t.privacyContent}
                </div>
            </div>
        </div>
    );
}
