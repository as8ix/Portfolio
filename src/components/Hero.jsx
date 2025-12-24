import { content } from '../data/content';

export default function Hero({ lang }) {
    const t = content[lang];
    const isArabic = lang === 'ar';

    return (
        <header className="relative w-full min-h-[90vh] flex flex-col justify-center px-6 md:px-20 pt-32 pb-20 overflow-hidden">
            {/* Background Glows */}
            <div className="rich-glow w-[500px] h-[500px] bg-blue-600/20 -top-20 -right-20 animate-float"></div>
            <div className="rich-glow w-[400px] h-[400px] bg-purple-600/10 bottom-0 -left-20 animate-float delay-500"></div>

            <div className="max-w-7xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20 items-center relative z-10">

                {/* Text Section */}
                <div className={`order-2 md:order-1 ${isArabic ? 'text-right' : 'text-left'}`}>
                    <p className="text-lg md:text-xl font-medium mb-4 text-gray-500 dark:text-gray-400 animate-fade-in-up">
                        👋 {t.heroSubtitle}
                    </p>
                    <h1 className="text-5xl md:text-7xl lg:text-8xl font-black leading-none tracking-tighter mb-6 dark:text-white animate-fade-in-up delay-100">
                        {t.heroTitle.split('&').map((part, i) => (
                            <span key={i} className="block">{part.trim()} {i === 0 && <span className="text-gray-300 dark:text-gray-600">&</span>} </span>
                        ))}
                    </h1>
                    <div className="h-1 w-20 bg-black dark:bg-white mb-8 animate-fade-in-up delay-200"></div>
                </div>

                {/* Image Section */}
                <div className="order-1 md:order-2 flex justify-center md:justify-end">
                    <div className="relative w-full max-w-xs md:max-w-md aspect-[3/4] overflow-hidden grayscale hover:grayscale-0 transition-all duration-700 ease-in-out shadow-2xl rounded-[40px] -rotate-2 hover:rotate-0 border-8 border-white dark:border-zinc-900 group">
                        <img
                            src="/images/portrait_main.jpg"
                            alt="Abdalla Portrait"
                            className="object-cover w-full h-full scale-105 group-hover:scale-100 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    </div>
                </div>
            </div>

            {/* Scroll indicator */}
            <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce">
                <div className="w-px h-16 bg-black/20"></div>
            </div>
        </header>
    );
}
