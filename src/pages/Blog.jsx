import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';

export default function Blog() {
    const [lang, setLang] = useState('ar');
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        document.documentElement.lang = lang;
        document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    }, [lang]);

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
        <div className={`min-h-screen ${lang === 'ar' ? 'font-arabic' : 'font-english'} bg-white dark:bg-[#0a0a0a] text-black dark:text-white selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black pt-20 transition-colors duration-300`}>
            <Navbar lang={lang} setLang={setLang} />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-5xl font-black mb-4">{lang === 'ar' ? 'المدونة' : 'Blog'}</h1>
                    <p className="text-gray-500 text-lg">{lang === 'ar' ? 'أفكار ومقالات تقنية وتجارب شخصية' : 'Thoughts, technical articles, and personal experiences'}</p>
                </div>

                {loading ? (
                    <div className="flex justify-center">
                        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : posts.length === 0 ? (
                    <div className="text-center py-20 bg-gray-50 dark:bg-zinc-900 rounded-lg">
                        <p className="text-gray-500 dark:text-gray-400 text-lg">{lang === 'ar' ? 'لا توجد منشورات حالياً' : 'No posts found yet.'}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {posts.map(post => (
                            <Link key={post.id} to={`/blog/${post.id}`} className="block group">
                                <article className="bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden border border-gray-100 dark:border-zinc-800 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 h-full flex flex-col">
                                    {post.image && (
                                        <div className="aspect-video overflow-hidden bg-gray-100 rounded-t-3xl">
                                            <img
                                                src={post.image}
                                                alt={post.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                        </div>
                                    )}
                                    <div className="p-6 flex flex-col flex-1">
                                        <h2 className="text-xl font-bold mb-3 line-clamp-2 leading-tight group-hover:text-blue-600 transition-colors dark:text-white">
                                            {post.title}
                                        </h2>
                                        <p className="text-gray-500 text-sm mb-4 line-clamp-3 flex-1 dark:text-gray-400">
                                            {post.content}
                                        </p>
                                        <div className="flex justify-between items-center text-xs text-gray-400 font-medium uppercase tracking-wider mt-auto">
                                            <span>{new Date(post.createdAt?.seconds * 1000).toLocaleDateString()}</span>
                                            <span>{post.views || 0} views</span>
                                        </div>
                                    </div>
                                </article>
                            </Link>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
