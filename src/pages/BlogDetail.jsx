import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { db } from '../firebase';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';

export default function BlogDetail() {
    const { id } = useParams();
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [lang, setLang] = useState('ar');

    useEffect(() => {
        document.documentElement.lang = lang;
        document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    }, [lang]);

    useEffect(() => {
        const fetchPost = async () => {
            try {
                const docRef = doc(db, "posts", id);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    setPost({ id: docSnap.id, ...docSnap.data() });
                    // Increment view count
                    await updateDoc(docRef, {
                        views: increment(1)
                    });
                } else {
                    console.log("No such document!");
                }
            } catch (error) {
                console.error("Error fetching post: ", error);
            } finally {
                setLoading(false);
            }
        };
        fetchPost();
    }, [id]);

    if (loading) {
        return (
            <div className={`min-h-screen ${lang === 'ar' ? 'font-arabic' : 'font-english'} bg-white dark:bg-[#0a0a0a] pt-20 flex items-center justify-center`}>
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!post) {
        return (
            <div className={`min-h-screen ${lang === 'ar' ? 'font-arabic' : 'font-english'} bg-white dark:bg-[#0a0a0a] pt-20 flex flex-col items-center justify-center text-black dark:text-white`}>
                <h2 className="text-2xl font-bold mb-4">{lang === 'ar' ? 'المنشور غير موجود' : 'Post not found'}</h2>
                <Link to="/blog" className="text-blue-600 hover:underline">
                    {lang === 'ar' ? 'العودة إلى المدونة' : 'Back to Blog'}
                </Link>
            </div>
        );
    }

    return (
        <div className={`min-h-screen ${lang === 'ar' ? 'font-arabic' : 'font-english'} bg-white dark:bg-[#0a0a0a] text-black dark:text-white selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black pt-20 transition-colors duration-300`}>
            <Navbar lang={lang} setLang={setLang} />

            <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <Link to="/blog" className="inline-flex items-center text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white mb-8 transition-colors">
                    <span className="text-xl mx-2">←</span>
                    {lang === 'ar' ? 'العودة للمدونة' : 'Back to Blog'}
                </Link>

                <header className="mb-10 text-center">
                    <h1 className="text-3xl md:text-5xl font-black mb-6 leading-tight">
                        {post.title}
                    </h1>
                    <div className="flex justify-center items-center gap-6 text-sm text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">
                        <span>{new Date(post.createdAt?.seconds * 1000).toLocaleDateString()}</span>
                        <span>{post.views || 0} views</span>
                    </div>
                </header>

                {post.image && (
                    <div className="mb-12 rounded-3xl overflow-hidden shadow-2xl">
                        <img
                            src={post.image}
                            alt={post.title}
                            className="w-full h-auto object-cover max-h-[600px]"
                        />
                    </div>
                )}

                <div className="prose prose-lg dark:prose-invert max-w-none prose-headings:font-bold prose-a:text-blue-600 hover:prose-a:text-blue-500">
                    <div className="whitespace-pre-wrap leading-relaxed text-gray-800 dark:text-gray-200">
                        {post.content}
                    </div>
                </div>
            </article>
        </div>
    );
}
