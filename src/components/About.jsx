import { content } from '../data/content';

export default function About({ lang }) {
    const t = content[lang];

    return (
        <section className="py-32 px-6 md:px-20 bg-white dark:bg-[#060606] relative overflow-hidden">
            {/* Background Accent */}
            <div className="rich-glow w-[400px] h-[400px] bg-blue-600/5 -top-20 -left-20 animate-float"></div>

            <div className="max-w-7xl mx-auto relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">

                    <div className="relative aspect-[4/5] overflow-hidden grayscale hover:grayscale-0 transition-all duration-700 max-w-sm mx-auto lg:max-w-full rounded-[40px] shadow-2xl rotate-2 hover:rotate-0 border-8 border-white dark:border-zinc-900 group">
                        <img
                            src="/images/madinah.jpg"
                            alt="Madinah"
                            className="object-cover w-full h-full scale-105 group-hover:scale-100 transition-transform duration-700"
                        />
                    </div>

                    <div className="lg:pr-10">
                        <div className="inline-block px-4 py-1.5 bg-blue-600/10 text-blue-600 dark:text-blue-400 text-xs font-bold tracking-widest uppercase mb-8 rounded-full">
                            {t.aboutTitle}
                        </div>
                        <h2 className="text-4xl md:text-6xl font-black mb-10 leading-none dark:text-white tracking-tighter">
                            {t.birth}
                        </h2>
                        <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                            {t.bio}
                        </p>
                        <div className="p-8 bg-gray-50 dark:bg-zinc-900/50 rounded-3xl border border-gray-100 dark:border-white/5">
                            <p className="text-lg text-gray-500 dark:text-gray-400 font-medium italic">
                                "{t.education}"
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
