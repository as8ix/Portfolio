import { content } from '../data/content';

export default function FloatingCoffee({ lang }) {
    const t = content[lang];
    const coffeeUrl = "https://buymeacoffee.com/abdallaashm";

    return (
        <a
            href={coffeeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="fixed bottom-6 right-6 z-[100] group flex items-center gap-3 bg-[#FFDD00] hover:bg-[#FFEA00] text-black px-5 py-3 rounded-full shadow-2xl transition-all hover:scale-105 active:scale-95 border-2 border-black/5"
        >
            {/* Custom SVG Coffee Cup */}
            <div className="relative w-8 h-8 flex items-center justify-center">
                <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-full h-full transform -rotate-12 group-hover:rotate-0 transition-transform duration-300"
                >
                    <path d="M18 8h1a4 4 0 0 1 0 8h-1"></path>
                    <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path>
                    <line x1="6" y1="1" x2="6" y2="4"></line>
                    <line x1="10" y1="1" x2="10" y2="4"></line>
                    <line x1="14" y1="1" x2="14" y2="4"></line>
                </svg>
            </div>
            <span className="font-black uppercase tracking-widest text-[11px] hidden md:block">
                {lang === 'ar' ? 'ادعمني بقهوة' : 'Buy me a coffee'}
            </span>
        </a>
    );
}
