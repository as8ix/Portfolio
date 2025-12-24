import { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, getDoc } from 'firebase/firestore';

import { useAuth } from '../App';

export default function AdminDashboard() {
    const { setIsMfaVerified } = useAuth();
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [image, setImage] = useState('');
    const [loading, setLoading] = useState(false);
    const [posts, setPosts] = useState([]);
    const [editingId, setEditingId] = useState(null);

    // Mock Analytics Data
    const [stats, setStats] = useState({
        visits: 0,
        uniqueVisitors: 0,
        posts: 0
    });

    const fetchStats = async () => {
        try {
            const statsRef = doc(db, "analytics", "site_stats");
            const statsSnap = await getDoc(statsRef);
            if (statsSnap.exists()) {
                const data = statsSnap.data();
                setStats(prev => ({
                    ...prev,
                    visits: data.visits || 0,
                    uniqueVisitors: data.uniqueVisitors || 0
                }));
            }
        } catch (error) {
            console.error("Error fetching stats:", error);
        }
    };

    const fetchPosts = async () => {
        const querySnapshot = await getDocs(collection(db, "posts"));
        const postsList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setPosts(postsList);
        setStats(prev => ({ ...prev, posts: postsList.length }));
        fetchStats(); // Fetch visits too
    };

    useEffect(() => {
        fetchPosts();
    }, []);

    const handleLogout = async () => {
        try {
            await signOut(auth);
            setIsMfaVerified(false);
            sessionStorage.removeItem('isMfaVerified');
            window.location.href = '/login';
        } catch (error) {
            console.error("Error signing out: ", error);
        }
    };

    const handleCreateOrUpdatePost = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (editingId) {
                // Update existing post
                const postRef = doc(db, "posts", editingId);
                await updateDoc(postRef, {
                    title,
                    content,
                    image,
                    lastUpdated: new Date()
                });
                alert('Post updated successfully!');
                setEditingId(null);
            } else {
                // Create new post
                await addDoc(collection(db, "posts"), {
                    title,
                    content,
                    image,
                    createdAt: new Date(),
                    views: 0
                });
                alert('Post created successfully!');
            }

            setTitle('');
            setContent('');
            setImage('');
            fetchPosts();
        } catch (error) {
            console.error("Error saving document: ", error);
            alert('Error saving post');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this post?")) return;
        try {
            await deleteDoc(doc(db, "posts", id));
            fetchPosts();
        } catch (error) {
            console.error("Error deleting document: ", error);
            alert("Error deleting post");
        }
    };

    const handleEdit = (post) => {
        setTitle(post.title);
        setContent(post.content);
        setImage(post.image);
        setEditingId(post.id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setTitle('');
        setContent('');
        setImage('');
    };

    return (
        <div className="min-h-screen bg-white dark:bg-[#060606] p-8 text-black dark:text-white transition-colors duration-500 relative overflow-hidden">
            {/* Background Glows */}
            <div className="rich-glow w-[600px] h-[600px] bg-blue-600/10 -top-20 -right-20 animate-float"></div>
            <div className="rich-glow w-[500px] h-[500px] bg-purple-600/10 -bottom-20 -left-20 animate-float delay-500"></div>

            <div className="max-w-6xl mx-auto relative z-10">
                <div className="flex justify-between items-end mb-12 animate-fade-in-up">
                    <div>
                        <h1 className="text-4xl font-black tracking-tighter mb-2">Dashboard</h1>
                        <p className="text-gray-500 dark:text-gray-400 font-medium">Manage your portfolio content and analytics.</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => window.location.reload()}
                            className="p-3 glass rounded-2xl text-gray-500 hover:text-blue-600 transition-colors"
                            title="Refresh Data"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        </button>
                        <button
                            onClick={handleLogout}
                            className="px-6 py-3 bg-red-600/10 hover:bg-red-600 text-red-600 hover:text-white text-sm font-bold rounded-2xl transition-all border border-red-600/20"
                        >
                            Logout
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                    {/* Stats Cards */}
                    <div className="premium-card p-10 animate-fade-in-up delay-100">
                        <div className="w-12 h-12 bg-blue-600/10 rounded-2xl flex items-center justify-center mb-6">
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                        </div>
                        <h3 className="text-gray-400 text-xs font-bold uppercase tracking-[0.2em] mb-2">Total Sessions</h3>
                        <p className="text-5xl font-black tracking-tight">{stats.visits.toLocaleString()}</p>
                    </div>
                    <div className="premium-card p-10 animate-fade-in-up delay-200">
                        <div className="w-12 h-12 bg-purple-600/10 rounded-2xl flex items-center justify-center mb-6">
                            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </div>
                        <h3 className="text-gray-400 text-xs font-bold uppercase tracking-[0.2em] mb-2">Unique Visitors</h3>
                        <p className="text-5xl font-black tracking-tight text-blue-600">{stats.uniqueVisitors.toLocaleString()}</p>
                    </div>
                    <div className="premium-card p-10 animate-fade-in-up delay-300">
                        <div className="w-12 h-12 bg-green-600/10 rounded-2xl flex items-center justify-center mb-6">
                            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10l4 4v10a2 2 0 01-2 2z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 2v4a2 2 0 002 2h4" />
                            </svg>
                        </div>
                        <h3 className="text-gray-400 text-xs font-bold uppercase tracking-[0.2em] mb-2">Total Posts</h3>
                        <p className="text-5xl font-black tracking-tight">{stats.posts}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
                    {/* Create/Edit Post Form */}
                    <div className="lg:col-span-3 space-y-8 animate-fade-in-up delay-500">
                        <div className="glass p-10 rounded-[40px] border dark:border-white/5">
                            <div className="flex justify-between items-center mb-10">
                                <h2 className="text-2xl font-black tracking-tight">{editingId ? 'Edit Article' : 'New Article'}</h2>
                                {editingId && (
                                    <button onClick={handleCancelEdit} className="text-sm font-bold text-gray-400 hover:text-black dark:hover:text-white transition-colors">
                                        Discard Changes
                                    </button>
                                )}
                            </div>

                            <form onSubmit={handleCreateOrUpdatePost} className="space-y-8">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-4">Title</label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        className="w-full px-8 py-4 bg-gray-50 dark:bg-zinc-800/50 border-none rounded-2xl focus:ring-2 focus:ring-blue-600 outline-none dark:text-white font-medium placeholder:text-gray-400 transition-all shadow-inner"
                                        placeholder="Enter Post Title..."
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-4">Image URL</label>
                                    <input
                                        type="url"
                                        value={image}
                                        onChange={(e) => setImage(e.target.value)}
                                        className="w-full px-8 py-4 bg-gray-50 dark:bg-zinc-800/50 border-none rounded-2xl focus:ring-2 focus:ring-blue-600 outline-none dark:text-white font-medium placeholder:text-gray-400 transition-all shadow-inner"
                                        placeholder="https://images.unsplash.com/..."
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-4">Content</label>
                                    <textarea
                                        value={content}
                                        onChange={(e) => setContent(e.target.value)}
                                        rows="10"
                                        className="w-full px-8 py-6 bg-gray-50 dark:bg-zinc-800/50 border-none rounded-[32px] focus:ring-2 focus:ring-blue-600 outline-none dark:text-white font-medium placeholder:text-gray-400 transition-all shadow-inner resize-none"
                                        placeholder="Write your story here..."
                                        required
                                    ></textarea>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className={`w-full py-5 rounded-2xl text-white font-black tracking-widest uppercase text-sm transition-all transform hover:scale-[1.01] active:scale-[0.99] shadow-2xl ${editingId ? 'bg-green-600 shadow-green-600/20' : 'bg-blue-600 shadow-blue-600/20'} `}
                                >
                                    {loading ? (
                                        <div className="flex items-center justify-center gap-3">
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            <span>Processing...</span>
                                        </div>
                                    ) : (editingId ? 'Update Article' : 'Publish Article')}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Posts List */}
                    <div className="lg:col-span-2 space-y-8 animate-fade-in-up delay-700">
                        <div className="glass p-10 rounded-[40px] border dark:border-white/5 max-h-[900px] overflow-y-auto custom-scrollbar">
                            <h2 className="text-2xl font-black tracking-tight mb-10">Recent Content</h2>
                            {posts.length === 0 ? (
                                <div className="text-center py-20">
                                    <p className="text-gray-400 font-medium">No articles published yet.</p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {posts.map(post => (
                                        <div key={post.id} className="p-6 glass rounded-3xl border border-gray-100 dark:border-white/5 hover:border-blue-600/30 transition-all group">
                                            <div className="flex items-start gap-4">
                                                {post.image ? (
                                                    <img src={post.image} alt={post.title} className="w-20 h-20 object-cover rounded-2xl grayscale group-hover:grayscale-0 transition-all" />
                                                ) : (
                                                    <div className="w-20 h-20 bg-gray-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center">
                                                        <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                        </svg>
                                                    </div>
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-bold text-lg leading-tight mb-1 truncate dark:text-white">{post.title}</h3>
                                                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4">
                                                        {new Date(post.createdAt?.seconds * 1000).toLocaleDateString()}
                                                    </p>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => handleEdit(post)}
                                                            className="px-4 py-1.5 text-[11px] font-black uppercase tracking-widest bg-blue-600/10 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg transition-all"
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(post.id)}
                                                            className="px-4 py-1.5 text-[11px] font-black uppercase tracking-widest bg-red-600/10 text-red-600 hover:bg-red-600 hover:text-white rounded-lg transition-all"
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
