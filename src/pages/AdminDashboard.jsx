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
        <div className="min-h-screen bg-gray-100 dark:bg-[#0a0a0a] p-8 text-black dark:text-white">
            <div className="max-w-5xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                    <div className="flex items-center gap-4">
                        <button onClick={() => window.location.reload()} className="text-sm text-blue-600 hover:underline">Refresh Data</button>
                        <button
                            onClick={handleLogout}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-red-600/20"
                        >
                            Logout
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    {/* Stats Cards */}
                    <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl shadow border dark:border-zinc-800">
                        <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium uppercase tracking-wider">Total Sessions</h3>
                        <p className="text-4xl font-bold mt-2">{stats.visits}</p>
                    </div>
                    <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl shadow border dark:border-zinc-800">
                        <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium uppercase tracking-wider">Unique Visitors</h3>
                        <p className="text-4xl font-bold mt-2 text-blue-600">{stats.uniqueVisitors}</p>
                    </div>
                    <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl shadow border dark:border-zinc-800">
                        <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium uppercase tracking-wider">Total Posts</h3>
                        <p className="text-4xl font-bold mt-2">{stats.posts}</p>
                    </div>
                </div>

                {/* Create/Edit Post Form */}
                <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl shadow mb-12 border dark:border-zinc-800">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold">{editingId ? 'Edit Post' : 'Create New Post'}</h2>
                        {editingId && <button onClick={handleCancelEdit} className="text-sm text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white">Cancel Edit</button>}
                    </div>

                    <form onSubmit={handleCreateOrUpdatePost} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Post Title</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full px-6 py-3 border border-gray-300 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white dark:bg-zinc-800 dark:text-white"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Image URL</label>
                            <input
                                type="url"
                                value={image}
                                onChange={(e) => setImage(e.target.value)}
                                className="w-full px-6 py-3 border border-gray-300 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white dark:bg-zinc-800 dark:text-white"
                                placeholder="https://..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Content</label>
                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                rows="6"
                                className="w-full px-6 py-3 border border-gray-300 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white dark:bg-zinc-800 dark:text-white"
                                required
                            ></textarea>
                        </div>

                        <div className="flex gap-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className={`px-8 py-3 rounded-xl text-white font-bold transition-all transform hover:-translate-y-0.5 ${editingId ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20'} `}
                            >
                                {loading ? 'Saving...' : (editingId ? 'Update Post' : 'Publish Post')}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Posts List */}
                <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg shadow border dark:border-zinc-800">
                    <h2 className="text-xl font-bold mb-6">Recent Posts</h2>
                    {posts.length === 0 ? (
                        <p className="text-gray-500 dark:text-gray-400">No posts yet.</p>
                    ) : (
                        <div className="space-y-4">
                            {posts.map(post => (
                                <div key={post.id} className="flex items-center justify-between p-4 border border-gray-100 dark:border-zinc-700 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        {post.image && <img src={post.image} alt={post.title} className="w-16 h-16 object-cover rounded" />}
                                        <div>
                                            <h3 className="font-bold text-lg">{post.title}</h3>
                                            <p className="text-xs text-gray-500">{new Date(post.createdAt?.seconds * 1000).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleEdit(post)}
                                            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded text-gray-700"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(post.id)}
                                            className="px-3 py-1 text-sm bg-red-50 hover:bg-red-100 text-red-600 rounded"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
