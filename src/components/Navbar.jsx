import { useState } from 'react';
import { Link } from 'react-router-dom';
import { content } from '../data/content';
import { useTheme } from '../hooks/useTheme';

export default function Navbar({ lang, setLang }) {
    const t = content[lang].navbar;
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { theme, toggleTheme } = useTheme();

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 glass transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-20">

                    {/* Left Section (LTR: Logo, RTL: CTA/Theme) */}
                    {/* In RTL (Ar), this is the LEFT side visually because of flex-row-reverse behavior or just normal flex with dir=rtl */}
                    {/* Wait, dir="rtl" flips flex-start/end. 
                        If we want Logo on RIGHT in Arabic:
                        - In RTL mode: Flex Start is RIGHT. So Logo should be first in DOM if we use items-start?
                        - The screenshot shows Logo on the RIGHT (Start in RTL).
                        - So Logo should be the 'start' item.
                        - The CTA is on the LEFT (End in RTL).
                    */}

                    {/* Logo & Nav Links Area */}
                    <div className="flex items-center gap-8">
                        {/* Logo */}
                        <Link to="/" className="flex items-center gap-2">
                            <h1 className="text-xl font-bold tracking-tighter">
                                <span className="text-blue-600">as8ix</span>
                            </h1>
                        </Link>

                        {/* Desktop Nav Links */}
                        <div className="hidden md:flex items-center gap-6">
                            <Link to="/" className="font-medium text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors">{t.home}</Link>
                            <a href="#" className="font-medium text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors">{t.about}</a>
                            <a href="#" className="font-medium text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors">{t.courses}</a>
                            <Link to="/blog" className="font-medium text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors">{t.blog}</Link>
                            <a href="#" className="font-medium text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors">{t.services}</a>
                            <a href="#" className="font-medium text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors">{t.contact}</a>
                            <div className="h-4 w-px bg-gray-200 dark:bg-gray-700 mx-2"></div>
                            <Link to="/login" className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors">Login</Link>
                        </div>
                    </div>


                    {/* Right Section (actions) - Buttons */}
                    <div className="flex items-center gap-4">
                        {/* Theme Toggle (Sun/Moon Icon) */}
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-full border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-300"
                        >
                            {theme === 'dark' ? (
                                // Moon Icon for Dark Mode
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                                </svg>
                            ) : (
                                // Sun Icon for Light Mode
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="5"></circle>
                                    <line x1="12" y1="1" x2="12" y2="3"></line>
                                    <line x1="12" y1="21" x2="12" y2="23"></line>
                                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                                    <line x1="1" y1="12" x2="3" y2="12"></line>
                                    <line x1="21" y1="12" x2="23" y2="12"></line>
                                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                                </svg>
                            )}
                        </button>

                        {/* Language Toggle (Small text button) */}
                        <button
                            onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
                            className="text-sm font-semibold text-gray-600 hover:text-black uppercase"
                        >
                            {lang === 'ar' ? 'EN' : 'عربي'}
                        </button>

                        {/* CTA Button */}
                        <a
                            href="cv.pdf"
                            download="Abdalla_CV.pdf"
                            className="hidden sm:inline-block px-6 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-medium rounded-full shadow-lg shadow-blue-700/20 transition-all transform hover:-translate-y-0.5"
                        >
                            {t.cta}
                        </a>

                        {/* Mobile Menu Button */}
                        <button
                            className="md:hidden p-2 text-gray-600"
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="3" y1="12" x2="21" y2="12"></line>
                                <line x1="3" y1="6" x2="21" y2="6"></line>
                                <line x1="3" y1="18" x2="21" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMenuOpen && (
                <div className="md:hidden bg-white dark:bg-[#0a0a0a] border-b border-gray-100 dark:border-white/10 p-4 space-y-4">
                    <Link to="/" onClick={() => setIsMenuOpen(false)} className="block py-2 font-medium text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white">{t.home}</Link>
                    <a href="#about" onClick={() => setIsMenuOpen(false)} className="block py-2 font-medium text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white">{t.about}</a>
                    <a href="#courses" onClick={() => setIsMenuOpen(false)} className="block py-2 font-medium text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white">{t.courses}</a>
                    <Link to="/blog" onClick={() => setIsMenuOpen(false)} className="block py-2 font-medium text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white">{t.blog}</Link>
                    <a href="#services" onClick={() => setIsMenuOpen(false)} className="block py-2 font-medium text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white">{t.services}</a>
                    <a href="#contact" onClick={() => setIsMenuOpen(false)} className="block py-2 font-medium text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white">{t.contact}</a>
                    <Link to="/login" onClick={() => setIsMenuOpen(false)} className="block py-2 font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300">Login</Link>
                    <div className="pt-4 border-t border-gray-100 dark:border-white/10">
                        <a
                            href="cv.pdf"
                            download="Abdalla_CV.pdf"
                            className="block w-full text-center px-6 py-3 bg-blue-700 text-white font-medium rounded-full"
                        >
                            {t.cta}
                        </a>
                    </div>
                </div>
            )}
        </nav>
    );
}
