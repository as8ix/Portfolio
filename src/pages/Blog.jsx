import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../App';
import Navbar from '../components/Navbar';
import useScrollReveal from '../hooks/useScrollReveal';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';

import MediaGrid from '../components/MediaGrid';

function BlogCard({ post, index, lang }) {
    const [revealRef, isVisible] = useScrollReveal({ threshold: 0.2 });

    // Normalize media
    const media = post.media || (post.image ? [{ url: post.image, type: 'image' }] : []);

    return (
        <Link
            ref={revealRef}
            to={`/blog/${post.id}`}
            className={`block group transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                }`}
            style={{ animationDelay: `${(index % 3) * 100}ms` }}
        >
            <article className={`premium-card h-full flex flex-col transition-all duration-700 ${isVisible ? 'grayscale-0' : 'grayscale'
                } group-hover:border-blue-600/30`}>

                {media.length > 0 && (
                    <div className="rounded-t-[38px] overflow-hidden">
                        <MediaGrid media={media} />
                    </div>
                )}

                <div className="p-8 flex flex-col flex-1">
                    <div className="flex items-center gap-3 mb-4">
                        <span className="h-px w-8 bg-blue-600/30"></span>
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-600">Article</span>
                    </div>
                    <h2 className="text-2xl font-bold mb-4 line-clamp-2 leading-tight dark:text-white group-hover:text-blue-600 transition-colors">
                        {post.title}
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 text-[15px] mb-6 line-clamp-3 flex-1 leading-relaxed">
                        {post.content}
                    </p>
                    <div className="pt-6 border-t border-gray-100 dark:border-white/5 flex justify-between items-center">
                        <span className="text-[11px] font-medium text-gray-400 uppercase tracking-widest">
                            {new Date(post.createdAt?.seconds * 1000).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                            })}
                        </span>
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400 group-hover:text-blue-600 transition-colors uppercase tracking-widest">
                            <span>Read More</span>
                            <svg className="w-3 h-3 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" />
                            </svg>
                        </div>
                    </div>
                </div>
            </article>
        </Link>
    );
}

export default function Blog() {
    const { lang, setLang } = useAuth();
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, "posts"));
                const postsList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setPosts(postsList);
            } catch (error) {
                console.error("Error fetching posts: ", error);
            } finally {
                setLoading(false);
            }
        };
        fetchPosts();
    }, []);

    return (
        <div className={`min-h-screen ${lang === 'ar' ? 'font-arabic' : 'font-english'} bg-white dark:bg-[#060606] text-black dark:text-white selection:bg-black selection:text-white pt-20 transition-colors duration-500 overflow-hidden relative`}>
            {/* Background Glows */}
            <div className="rich-glow w-[500px] h-[500px] bg-blue-600/10 top-0 -right-20 animate-float"></div>
            <div className="rich-glow w-[400px] h-[400px] bg-purple-600/10 bottom-0 -left-20 animate-float delay-500"></div>

            <Navbar lang={lang} setLang={setLang} />

            <main className="max-w-7xl mx-auto px-6 sm:px-8 py-20 relative z-10">
                <div className="text-center mb-20 animate-fade-in-up">
                    <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tighter">
                        {lang === 'ar' ? 'المدونة' : 'The Blog'}
                    </h1>
                    <div className="h-1.5 w-24 bg-blue-600 mx-auto mb-8 rounded-full"></div>
                    <p className="text-gray-500 dark:text-gray-400 text-xl max-w-2xl mx-auto leading-relaxed">
                        {lang === 'ar' ? 'أفكار ومقالات تقنية وتجارب شخصية' : 'Thoughts, technical articles, and personal experiences from my journey.'}
                    </p>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : posts.length === 0 ? (
                    <div className="text-center py-32 glass rounded-[40px] border dark:border-white/5 animate-fade-in-up delay-100">
                        <p className="text-gray-500 dark:text-gray-400 text-xl">
                            {lang === 'ar' ? 'لا توجد منشورات حالياً' : 'No posts found yet. Check back soon!'}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                        {posts.map((post, index) => (
                            <BlogCard key={post.id} post={post} index={index} lang={lang} />
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
