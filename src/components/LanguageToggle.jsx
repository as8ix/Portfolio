export default function LanguageToggle({ lang, setLang }) {
    return (
        <button
            onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
            className="fixed top-6 right-6 z-50 px-4 py-2 bg-black text-white rounded-full font-bold hover:bg-gray-800 transition-colors uppercase text-sm tracking-widest"
        >
            {lang === 'ar' ? 'English' : 'العربية'}
        </button>
    );
}
