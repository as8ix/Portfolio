import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../App';
import Navbar from '../components/Navbar';
import { db } from '../firebase';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';

export default function BlogDetail() {
    const { id } = useParams();
    const { lang, setLang } = useAuth();
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);

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
        <div className={`min-h-screen ${lang === 'ar' ? 'font-arabic' : 'font-english'} bg-white dark:bg-[#060606] text-black dark:text-white selection:bg-black selection:text-white pt-20 transition-colors duration-500 overflow-hidden relative`}>
            {/* Background Glows */}
            <div className="rich-glow w-[500px] h-[500px] bg-blue-600/10 top-0 -right-20 animate-float"></div>
            <div className="rich-glow w-[400px] h-[400px] bg-purple-600/10 bottom-0 -left-20 animate-float delay-500"></div>

            <Navbar lang={lang} setLang={setLang} />

            <article className="max-w-4xl mx-auto px-6 sm:px-8 py-20 relative z-10">
                <Link to="/blog" className="inline-flex items-center gap-2 text-gray-400 hover:text-blue-600 mb-12 transition-all font-bold tracking-widest uppercase text-xs group">
                    <span className="transform group-hover:-translate-x-1 transition-transform">←</span>
                    {lang === 'ar' ? 'العودة للمدونة' : 'Back to Blog'}
                </Link>

                <header className="mb-16 text-center animate-fade-in-up">
                    <div className="flex justify-center items-center gap-3 mb-8">
                        <span className="h-px w-8 bg-blue-600/30"></span>
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-600">Article View</span>
                        <span className="h-px w-8 bg-blue-600/30"></span>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black mb-10 leading-tight tracking-tighter">
                        {post.title}
                    </h1>
                    <div className="flex justify-center items-center gap-8 text-[11px] text-gray-400 font-bold uppercase tracking-widest">
                        <span className="flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {new Date(post.createdAt?.seconds * 1000).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        <span className="flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            {post.views || 0}
                        </span>
                    </div>
                </header>

                {post.image && (
                    <div className="mb-20 rounded-[48px] overflow-hidden shadow-2xl border-8 border-white dark:border-zinc-900 rotate-1 animate-fade-in-up delay-100">
                        <img
                            src={post.image}
                            alt={post.title}
                            className="w-full h-auto object-cover max-h-[700px] grayscale hover:grayscale-0 transition-all duration-700"
                        />
                    </div>
                )}

                <div className="glass p-10 md:p-16 rounded-[48px] border dark:border-white/5 animate-fade-in-up delay-200">
                    <div className="prose prose-lg dark:prose-invert max-w-none prose-headings:font-black prose-headings:tracking-tight prose-a:text-blue-600">
                        <div className="whitespace-pre-wrap leading-relaxed text-gray-700 dark:text-gray-300 text-lg">
                            {post.content}
                        </div>
                    </div>
                </div>

                <div className="mt-20 pt-12 border-t border-gray-100 dark:border-white/5 text-center">
                    <Link to="/blog" className="px-10 py-4 bg-gray-50 dark:bg-zinc-900 hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black rounded-2xl font-bold transition-all inline-block">
                        {lang === 'ar' ? 'العودة لجميع المقالات' : 'Back to All Articles'}
                    </Link>
                </div>
            </article>
        </div>
    );
}
