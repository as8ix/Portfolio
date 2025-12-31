import { useState } from 'react';
import MediaLightbox from './MediaLightbox';

export default function MediaGrid({ media }) {
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [initialIndex, setInitialIndex] = useState(0);

    if (!media || media.length === 0) return null;

    const openLightbox = (index) => {
        setInitialIndex(index);
        setLightboxOpen(true);
    };

    // Layout Logic
    const count = media.length;
    let gridClass = '';

    if (count === 1) {
        gridClass = 'grid-cols-1';
    } else if (count === 2) {
        gridClass = 'grid-cols-2';
    } else if (count === 3) {
        gridClass = 'grid-cols-2 grid-rows-2';
    } else if (count === 4) {
        gridClass = 'grid-cols-2 grid-rows-2';
    } else {
        // Fallback or "More" view (basic implementation for now)
        gridClass = 'grid-cols-2 grid-rows-2';
    }

    return (
        <>
            <div className={`grid gap-0.5 w-full aspect-[16/9] rounded-2xl overflow-hidden border border-gray-100 dark:border-white/10 ${gridClass}`}>
                {media.slice(0, 4).map((item, index) => {
                    // Determine span for 3 items: First item takes full height on left
                    let spanClass = '';
                    if (count === 3 && index === 0) {
                        spanClass = 'row-span-2 h-full';
                    }

                    const normalizedItem = typeof item === 'string' ? { url: item, type: 'image' } : item;

                    return (
                        <div
                            key={index}
                            className={`relative overflow-hidden bg-black/5 dark:bg-zinc-800 ${spanClass}`}
                            onClick={() => openLightbox(index)}
                        >
                            {normalizedItem.type === 'video' ? (
                                <div className="w-full h-full relative group cursor-pointer">
                                    <video
                                        src={normalizedItem.url}
                                        className="w-full h-full object-cover"
                                        preload="metadata"
                                        crossOrigin="anonymous"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/10 transition-colors">
                                        <div className="w-12 h-12 rounded-full bg-white/30 backdrop-blur flex items-center justify-center">
                                            <div className="w-0 h-0 border-t-[6px] border-t-transparent border-l-[10px] border-l-white border-b-[6px] border-b-transparent ml-1"></div>
                                        </div>
                                    </div>
                                    <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/50 backdrop-blur rounded text-[10px] font-bold text-white uppercase pointer-events-none">
                                        Video
                                    </div>
                                </div>
                            ) : (
                                <div className="w-full h-full relative cursor-pointer hover:opacity-90 transition-opacity">
                                    <img
                                        src={normalizedItem.url}
                                        alt={`media-${index}`}
                                        className="w-full h-full object-cover"
                                        crossOrigin="anonymous"
                                        onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.classList.add('bg-zinc-800'); }}
                                    />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {lightboxOpen && (
                <MediaLightbox
                    media={media}
                    initialIndex={initialIndex}
                    onClose={() => setLightboxOpen(false)}
                />
            )}
        </>
    );
}
