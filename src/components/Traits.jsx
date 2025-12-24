import { content } from '../data/content';
import useScrollReveal from '../hooks/useScrollReveal';

function TraitCard({ trait, index }) {
    const [revealRef, isVisible] = useScrollReveal({ threshold: 0.2 });

    return (
        <div
            ref={revealRef}
            className={`premium-card p-10 group transition-all duration-1000 ease-out ${isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-12 scale-95'
                }`}
            style={{ transitionDelay: `${index * 150}ms` }}
        >
            <div className="w-14 h-14 bg-blue-600 dark:bg-white rounded-2xl mb-8 flex items-center justify-center text-white dark:text-black shadow-lg shadow-blue-600/20 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
            </div>
            <h3 className="text-2xl font-bold mb-4 dark:text-white">
                {trait.title}
            </h3>
            <p className="text-lg text-gray-500 dark:text-gray-400 leading-relaxed">
                {trait.desc}
            </p>
        </div>
    );
}

export default function Traits({ lang }) {
    const t = content[lang];

    return (
        <section className="py-32 px-6 md:px-20 bg-gray-50/50 dark:bg-zinc-950/50 relative overflow-hidden">
            {/* Subtle bg detail */}
            <div className="absolute top-0 right-0 w-1/2 h-full bg-blue-600/5 blur-[120px] pointer-events-none"></div>

            <div className="max-w-7xl mx-auto relative z-10">
                <h2 className="text-4xl md:text-6xl font-black mb-20 uppercase dark:text-white tracking-tighter">
                    {t.traitsTitle}
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {t.traits.map((trait, index) => (
                        <TraitCard key={index} trait={trait} index={index} />
                    ))}
                </div>
            </div>
        </section>
    );
}
