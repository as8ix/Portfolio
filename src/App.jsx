import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import Blog from './pages/Blog';
import BlogDetail from './pages/BlogDetail';
import { auth } from './firebase';
import { ThemeProvider } from './hooks/useTheme';

// Simple Auth Wrapper
import { useEffect, useState, createContext, useContext } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import VerifyOTP from './pages/VerifyOTP';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import Contact from './pages/Contact';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

function RequireAuth({ children }) {
  const { user, loading, isMfaVerified } = useAuth();

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#060606]">
    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
  </div>;

  if (!user) return <Navigate to="/login" replace />;
  if (!isMfaVerified) return <Navigate to="/verify-otp" replace />;

  return children;
}

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMfaVerified, setIsMfaVerified] = useState(
    () => sessionStorage.getItem('isMfaVerified') === 'true'
  );

  const [lang, setLang] = useState('ar');

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Update sessionStorage whenever MFA status changes
  useEffect(() => {
    sessionStorage.setItem('isMfaVerified', isMfaVerified);
  }, [isMfaVerified]);

  return (
    <ThemeProvider>
      <AuthContext.Provider value={{ user, loading, isMfaVerified, setIsMfaVerified, lang, setLang }}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:id" element={<BlogDetail />} />
            <Route path="/login" element={<Login />} />
            <Route path="/verify-otp" element={<VerifyOTP />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/contact" element={<Contact />} />
            <Route
              path="/admin"
              element={
                <RequireAuth>
                  <AdminDashboard />
                </RequireAuth>
              }
            />
          </Routes>
        </BrowserRouter>
      </AuthContext.Provider>
    </ThemeProvider>
  );
}

export default App;
