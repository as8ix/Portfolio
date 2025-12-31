import { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, getDoc } from 'firebase/firestore';

import { useAuth } from '../App';
import { useTheme } from '../hooks/useTheme';
import MediaLightbox from '../components/MediaLightbox'; // Assuming previous integration
import VideoCompressor from '../components/VideoCompressor'; // Import the new component

export default function AdminDashboard() {
    const { setIsMfaVerified } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [mediaFiles, setMediaFiles] = useState([]); // Files to upload
    const [existingMedia, setExistingMedia] = useState([]); // URLs from DB for editing
    const [uploadProgress, setUploadProgress] = useState(0); // Add progress tracking if feasible with XHR
    const [loading, setLoading] = useState(false);
    const [posts, setPosts] = useState([]);
    const [messages, setMessages] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [activeTab, setActiveTab] = useState('posts'); // 'posts' or 'messages'

    // Compression State
    const [fileToCompress, setFileToCompress] = useState(null);

    // Mock Analytics Data
    const [stats, setStats] = useState({
        visits: 0,
        uniqueVisitors: 0,
        posts: 0,
        messages: 0
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

    const fetchMessages = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, "messages"));
            const messagesList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
                .sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds);
            setMessages(messagesList);
            setStats(prev => ({ ...prev, messages: messagesList.length }));
        } catch (error) {
            console.error("Error fetching messages:", error);
        }
    };

    useEffect(() => {
        fetchPosts();
        fetchMessages();
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

    const handleFileChange = (e) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            const validFiles = [];

            for (const file of newFiles) {
                const sizeMB = file.size / (1024 * 1024);
                if (sizeMB > 99) { // 99MB limit
                    // Trigger compressor for the first large file found (one at a time for simplicity)
                    setFileToCompress(file);
                    // Don't add to validFiles yet
                } else {
                    validFiles.push(file);
                }
            }

            if (validFiles.length > 0) {
                setMediaFiles(prev => [...prev, ...validFiles]);
            }
        }
    };

    const handleCompressed = (compressedFile) => {
        setMediaFiles(prev => [...prev, compressedFile]);
        setFileToCompress(null);
    };

    const removeFile = (index) => {
        setMediaFiles(prev => prev.filter((_, i) => i !== index));
    };

    const removeExistingMedia = (index) => {
        setExistingMedia(prev => prev.filter((_, i) => i !== index));
    };

    const uploadToCloudinary = async (file) => {
        const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
        const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

        if (!cloudName || !uploadPreset) {
            throw new Error("Missing Cloudinary credentials. Please set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET in .env");
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', uploadPreset);

        const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || 'Upload failed');
        }

        const data = await response.json();
        return {
            url: data.secure_url,
            type: data.resource_type === 'video' ? 'video' : 'image',
            name: file.name
        };
    };

    const handleCreateOrUpdatePost = async (e) => {
        e.preventDefault();
        setLoading(true);
        setUploadProgress(0);

        try {
            // Upload new files
            const uploadedMedia = [];

            if (mediaFiles.length > 0) {
                // Upload sequentially to keep it simple, or Promise.all for speed
                // Using loop here to handle errors individually if needed
                for (const file of mediaFiles) {
                    try {
                        const result = await uploadToCloudinary(file);
                        uploadedMedia.push(result);
                    } catch (err) {
                        console.error(`Failed to upload ${file.name}:`, err);
                        alert(`Failed to upload ${file.name}: ${err.message}`);
                        // Optionally continue or break
                        throw err; // Break for now
                    }
                }
            }

            // Combine with existing media
            const finalMedia = [...existingMedia, ...uploadedMedia];

            if (editingId) {
                // Update existing post
                const postRef = doc(db, "posts", editingId);
                await updateDoc(postRef, {
                    title,
                    content,
                    media: finalMedia,
                    lastUpdated: new Date()
                });
                alert('Post updated successfully!');
                setEditingId(null);
            } else {
                // Create new post
                await addDoc(collection(db, "posts"), {
                    title,
                    content,
                    media: finalMedia,
                    createdAt: new Date(),
                    views: 0
                });
                alert('Post created successfully!');
            }

            setTitle('');
            setContent('');
            setMediaFiles([]);
            setExistingMedia([]);
            fetchPosts();
        } catch (error) {
            console.error("Error saving document: ", error);
            alert('Error saving post: ' + error.message);
        } finally {
            setLoading(false);
            setUploadProgress(0);
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

    const handleDeleteMessage = async (id) => {
        if (!window.confirm("Delete this message?")) return;
        try {
            await deleteDoc(doc(db, "messages", id));
            fetchMessages();
        } catch (error) {
            console.error("Error deleting message: ", error);
            alert("Error deleting message");
        }
    };

    const handleEdit = (post) => {
        setTitle(post.title);
        setContent(post.content);
        if (post.media) {
            setExistingMedia(post.media);
        } else if (post.image) {
            setExistingMedia([{ url: post.image, type: 'image' }]);
        } else {
            setExistingMedia([]);
        }
        setMediaFiles([]);
        setEditingId(post.id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setTitle('');
        setContent('');
        setMediaFiles([]);
        setExistingMedia([]);
    };

    return (
        <div className="min-h-screen bg-white dark:bg-[#060606] p-4 md:p-8 text-black dark:text-white transition-colors duration-500 relative overflow-hidden">
            {/* Background Glows */}
            <div className="rich-glow w-[600px] h-[600px] bg-blue-600/10 -top-20 -right-20 animate-float"></div>
            <div className="rich-glow w-[500px] h-[500px] bg-purple-600/10 -bottom-20 -left-20 animate-float delay-500"></div>

            <div className="max-w-6xl mx-auto relative z-10">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12 animate-fade-in-up">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-black tracking-tighter mb-2">Dashboard</h1>
                        <p className="text-gray-500 dark:text-gray-400 font-medium text-sm md:text-base">Manage your portfolio content and analytics.</p>
                    </div>
                    <div className="flex items-center gap-3 md:gap-4 w-full md:w-auto">
                        <button
                            onClick={toggleTheme}
                            className="p-3 glass rounded-2xl text-gray-500 hover:text-blue-600 transition-colors"
                            title="Toggle Theme"
                        >
                            {theme === 'dark' ? (
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                                </svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="5"></circle>
                                    <line x1="12" y1="1" x2="12" y2="3"></line>
                                    <line x1="12" y1="21" x2="12" y2="23"></line>
                                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                                    <line x1="1" y1="12" x2="3" y2="12"></line>
                                    <line x1="21" y1="12" x2="23" y2="12"></line>
                                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                                </svg>
                            )}
                        </button>
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

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 mb-16">
                    <div className="premium-card p-6 md:p-10 animate-fade-in-up delay-100">
                        <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-600/10 rounded-2xl flex items-center justify-center mb-4 md:mb-6">
                            <svg className="w-5 h-5 md:w-6 md:h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                        </div>
                        <h3 className="text-gray-400 text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] mb-2">Total Sessions</h3>
                        <p className="text-3xl md:text-5xl font-black tracking-tight">{stats.visits.toLocaleString()}</p>
                    </div>
                    <div className="premium-card p-6 md:p-10 animate-fade-in-up delay-200">
                        <div className="w-10 h-10 md:w-12 md:h-12 bg-purple-600/10 rounded-2xl flex items-center justify-center mb-4 md:mb-6">
                            <svg className="w-5 h-5 md:w-6 md:h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </div>
                        <h3 className="text-gray-400 text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] mb-2">Unique Visitors</h3>
                        <p className="text-3xl md:text-5xl font-black tracking-tight text-blue-600">{stats.uniqueVisitors.toLocaleString()}</p>
                    </div>
                    <div className="premium-card p-6 md:p-10 animate-fade-in-up delay-300">
                        <div className="w-10 h-10 md:w-12 md:h-12 bg-orange-600/10 rounded-2xl flex items-center justify-center mb-4 md:mb-6">
                            <svg className="w-5 h-5 md:w-6 md:h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                            </svg>
                        </div>
                        <h3 className="text-gray-400 text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] mb-2">Articles</h3>
                        <p className="text-3xl md:text-5xl font-black tracking-tight">{stats.posts}</p>
                    </div>
                    <div className="premium-card p-6 md:p-10 animate-fade-in-up delay-300">
                        <div className="w-10 h-10 md:w-12 md:h-12 bg-green-600/10 rounded-2xl flex items-center justify-center mb-4 md:mb-6">
                            <svg className="w-5 h-5 md:w-6 md:h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <h3 className="text-gray-400 text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] mb-2">Messages</h3>
                        <p className="text-3xl md:text-5xl font-black tracking-tight">{stats.messages}</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-4 mb-12">
                    <button
                        onClick={() => setActiveTab('posts')}
                        className={`px-8 py-3 rounded-2xl font-bold tracking-widest uppercase text-xs transition-all ${activeTab === 'posts' ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20' : 'glass text-gray-400 hover:text-black dark:hover:text-white'}`}
                    >
                        Articles
                    </button>
                    <button
                        onClick={() => setActiveTab('messages')}
                        className={`px-8 py-3 rounded-2xl font-bold tracking-widest uppercase text-xs transition-all ${activeTab === 'messages' ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20' : 'glass text-gray-400 hover:text-black dark:hover:text-white'}`}
                    >
                        Messages
                    </button>
                </div>

                {activeTab === 'posts' && (
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
                        {/* Create/Edit Post Form */}
                        <div className="lg:col-span-3 space-y-8 animate-fade-in-up delay-500">
                            <div className="glass p-6 md:p-10 rounded-[32px] md:rounded-[40px] border dark:border-white/5">
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
                                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-4">Photos & Videos</label>

                                        {/* Upload Area */}
                                        <div className="relative group">
                                            <input
                                                type="file"
                                                onChange={handleFileChange}
                                                multiple
                                                accept="image/*,video/*"
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                            />
                                            <div className="w-full py-8 bg-gray-50 dark:bg-zinc-800/50 border-2 border-dashed border-gray-200 dark:border-zinc-700 rounded-2xl flex flex-col items-center justify-center transition-all group-hover:border-blue-500 group-hover:bg-blue-50/5 dark:group-hover:bg-blue-900/10">
                                                <div className="w-12 h-12 bg-white dark:bg-zinc-700 rounded-full flex items-center justify-center shadow-lg mb-3">
                                                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                                    </svg>
                                                </div>
                                                <p className="text-sm font-bold text-gray-500 dark:text-gray-400">Click to add photos or videos</p>
                                                <p className="text-xs text-gray-400 mt-1">Supports multiple files</p>
                                            </div>
                                        </div>

                                        {/* Preview Area */}
                                        {(mediaFiles.length > 0 || existingMedia.length > 0) && (
                                            <div className="grid grid-cols-3 gap-4 mt-4">
                                                {existingMedia.map((item, index) => (
                                                    <div key={`existing-${index}`} className="relative group aspect-square rounded-xl overflow-hidden bg-black/5 dark:bg-zinc-800">
                                                        {item.type === 'video' ? (
                                                            <video src={item.url} className="w-full h-full object-cover opacity-60" />
                                                        ) : (
                                                            <img src={item.url} alt="preview" className="w-full h-full object-cover" />
                                                        )}
                                                        <div className="absolute inset-0 flex items-center justify-center">
                                                            {item.type === 'video' && <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur flex items-center justify-center"><div className="w-0 h-0 border-t-[5px] border-t-transparent border-l-[8px] border-l-white border-b-[5px] border-b-transparent ml-0.5"></div></div>}
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => removeExistingMedia(index)}
                                                            className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform z-20"
                                                        >
                                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                                        </button>
                                                        <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/50 backdrop-blur rounded text-[10px] font-bold text-white uppercase">Existing</div>
                                                    </div>
                                                ))}

                                                {mediaFiles.map((file, index) => (
                                                    <div key={`new-${index}`} className="relative group aspect-square rounded-xl overflow-hidden bg-black/5 dark:bg-zinc-800">
                                                        {file.type.startsWith('video') ? (
                                                            <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-gray-500">
                                                                Video File
                                                            </div>
                                                        ) : (
                                                            <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-cover" />
                                                        )}
                                                        <button
                                                            type="button"
                                                            onClick={() => removeFile(index)}
                                                            className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                                                        >
                                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
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
                            <div className="glass p-6 md:p-10 rounded-[32px] md:rounded-[40px] border dark:border-white/5 max-h-[900px] overflow-y-auto custom-scrollbar">
                                <h2 className="text-2xl font-black tracking-tight mb-10">Recent Content</h2>
                                {posts.length === 0 ? (
                                    <div className="text-center py-20">
                                        <p className="text-gray-400 font-medium">No articles published yet.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {posts.map(post => (
                                            <div key={post.id} className="p-4 md:p-5 glass rounded-3xl border border-gray-100 dark:border-white/5 hover:border-blue-600/30 transition-all group relative overflow-hidden">
                                                <div className="flex flex-col-reverse sm:flex-row items-start sm:items-center justify-between gap-4" dir="ltr">
                                                    <div className="flex-1 min-w-0 pr-4">
                                                        <h3 className="font-bold text-lg leading-tight mb-1 truncate dark:text-white" title={post.title}>{post.title}</h3>
                                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
                                                            {new Date(post.createdAt?.seconds * 1000).toLocaleDateString()}
                                                        </p>
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                onClick={() => handleDelete(post.id)}
                                                                className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest bg-red-600/10 text-red-600 hover:bg-red-600 hover:text-white rounded-lg transition-all"
                                                            >
                                                                Delete
                                                            </button>
                                                            <button
                                                                onClick={() => handleEdit(post)}
                                                                className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest bg-blue-600/10 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg transition-all"
                                                            >
                                                                Edit
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Thumbnail (Right) */}
                                                    <div className="w-20 h-20 bg-gray-100 dark:bg-zinc-800 rounded-2xl overflow-hidden flex-shrink-0 border border-gray-200 dark:border-white/10 relative">
                                                        {post.media && post.media.length > 0 ? (
                                                            post.media[0].type === 'video' ? (
                                                                <div className="w-full h-full relative">
                                                                    <video src={post.media[0].url} className="w-full h-full object-cover opacity-80" crossOrigin="anonymous" />
                                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                                        <div className="w-6 h-6 rounded-full bg-white/30 backdrop-blur flex items-center justify-center">
                                                                            <div className="w-0 h-0 border-t-[3px] border-t-transparent border-l-[6px] border-l-white border-b-[3px] border-b-transparent ml-0.5"></div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <img
                                                                    src={post.media[0].url}
                                                                    alt={post.title}
                                                                    className="w-full h-full object-cover"
                                                                    crossOrigin="anonymous"
                                                                    onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.classList.add('bg-gray-800'); }}
                                                                />
                                                            )
                                                        ) : post.image ? (
                                                            <img
                                                                src={post.image}
                                                                alt={post.title}
                                                                className="w-full h-full object-cover"
                                                                crossOrigin="anonymous"
                                                                onError={(e) => { e.target.style.display = 'none'; }}
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-zinc-800 text-gray-300">
                                                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                                </svg>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'messages' && (
                    /* Messages Tab Content */
                    <div className="space-y-8 animate-fade-in-up">
                        <div className="glass p-6 md:p-10 rounded-[32px] md:rounded-[40px] border dark:border-white/5">
                            <div className="flex justify-between items-center mb-8 md:mb-10">
                                <h2 className="text-xl md:text-2xl font-black tracking-tight">Inbox</h2>
                                <button onClick={fetchMessages} className="text-sm font-bold text-blue-600">Refresh</button>
                            </div>

                            {messages.length === 0 ? (
                                <div className="text-center py-20">
                                    <p className="text-gray-400 font-medium font-arabic">لا توجد رسائل حالياً.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                                    {messages.map(msg => (
                                        <div key={msg.id} className="p-6 md:p-8 glass rounded-3xl border border-gray-100 dark:border-white/5 hover:border-blue-600/30 transition-all group relative overflow-hidden">
                                            <div className="flex justify-between items-start mb-4 md:mb-6">
                                                <div className="min-w-0 flex-1">
                                                    <h3 className="font-bold text-lg md:text-xl mb-1 truncate">{msg.user_name}</h3>
                                                    <p className="text-xs md:text-sm text-blue-600 font-medium truncate">{msg.user_email}</p>
                                                </div>
                                                <button
                                                    onClick={() => handleDeleteMessage(msg.id)}
                                                    className="p-2 text-gray-300 hover:text-red-600 transition-colors flex-shrink-0"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                            <div className="bg-gray-50 dark:bg-zinc-800/50 p-4 md:p-6 rounded-2xl mb-4">
                                                <p className="text-sm md:text-base text-gray-600 dark:text-gray-300 whitespace-pre-wrap leading-relaxed break-words">{msg.message}</p>
                                            </div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                                {msg.createdAt?.seconds ? new Date(msg.createdAt.seconds * 1000).toLocaleString() : 'Just now'}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* In-App Compressor */}
            {fileToCompress && (
                <VideoCompressor
                    file={fileToCompress}
                    onCompressed={handleCompressed}
                    onCancel={() => setFileToCompress(null)}
                />
            )}
        </div>
    );
}
