import { useState, useEffect, useCallback } from 'react';

export default function MediaLightbox({ media, initialIndex, onClose }) {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);

    // Lock body scroll when open
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    const handleNext = useCallback(() => {
        setCurrentIndex((prev) => (prev + 1) % media.length);
    }, [media.length]);

    const handlePrev = useCallback(() => {
        setCurrentIndex((prev) => (prev - 1 + media.length) % media.length);
    }, [media.length]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowRight') handleNext();
            if (e.key === 'ArrowLeft') handlePrev();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose, handleNext, handlePrev]);

    const rawItem = media[currentIndex];
    const currentItem = typeof rawItem === 'string' ? { url: rawItem, type: 'image' } : rawItem;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl animate-fade-in"
            onClick={onClose}
        >
            {/* Close Button */}
            <button
                onClick={onClose}
                className="absolute top-6 left-6 z-50 p-2 bg-black/50 text-white rounded-full hover:bg-white/20 transition-colors"
                title="Close (Esc)"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>

            {/* Navigation Buttons (only if multiple items) */}
            {media.length > 1 && (
                <>
                    <button
                        onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                        className="absolute left-4 z-50 p-3 bg-black/50 text-white rounded-full hover:bg-white/20 transition-colors backdrop-blur group"
                        title="Previous (Left Arrow)"
                    >
                        <svg className="w-6 h-6 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); handleNext(); }}
                        className="absolute right-4 z-50 p-3 bg-black/50 text-white rounded-full hover:bg-white/20 transition-colors backdrop-blur group"
                        title="Next (Right Arrow)"
                    >
                        <svg className="w-6 h-6 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </>
            )}

            {/* Content */}
            <div
                className="w-full h-full max-w-7xl max-h-screen p-4 flex items-center justify-center"
                onClick={(e) => e.stopPropagation()}
            >
                {currentItem.type === 'video' ? (
                    <video
                        src={currentItem.url}
                        className="max-w-full max-h-full rounded shadow-2xl"
                        controls
                        autoPlay
                        crossOrigin="anonymous"
                    />
                ) : (
                    <img
                        src={currentItem.url}
                        alt={currentItem.name || 'Media content'}
                        className="max-w-full max-h-full object-contain rounded shadow-2xl"
                        crossOrigin="anonymous"
                    />
                )}
            </div>

            {/* Counter */}
            {media.length > 1 && (
                <div className="absolute top-6 right-6 px-4 py-2 bg-black/50 backdrop-blur rounded-full text-white font-bold text-sm tracking-widest">
                    {currentIndex + 1} / {media.length}
                </div>
            )}
        </div>
    );
}
