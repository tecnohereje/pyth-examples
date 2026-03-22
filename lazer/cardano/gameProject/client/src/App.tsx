import { useState, useEffect } from 'react';
import { Routes, Route, Link, Navigate } from 'react-router-dom';
import './App.css';
import { HomeIcon, StoreIcon, UserIcon } from './components/Icons'; 
import { Home } from './pages/Home';
import { Missions } from './pages/Missions';
import { Store } from './pages/Store';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { MerchantDashboard } from './pages/merchant/MerchantDashboard';
import { Profile } from './pages/Profile';
import { Checkout } from './pages/Checkout';
import { Login } from './pages/Login';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { MeshProvider } from '@meshsdk/react';
import { apiFetch } from './utils/api';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const ENABLE_GOOGLE_AUTH = import.meta.env.VITE_ENABLE_GOOGLE_AUTH === 'true';

// Layout Component
const AppLayout = ({ children, user }: { children: React.ReactNode, user: any }) => {
  if (ENABLE_GOOGLE_AUTH && !user) {
    return <>{children}</>; 
  }

  return (
    <div className="app-container">
      <header className="top-nav-glass">
        <div className="flex justify-center items-center w-full" style={{ padding: '0.75rem 1.25rem', maxWidth: '1200px', margin: '0 auto' }}>
          <nav className="flex justify-around items-center w-full">
            <Link to="/" className="nav-item-top">
              <HomeIcon /> <span className="nav-label">Misiones</span>
            </Link>
            <Link to="/store" className="nav-item-top">
              <StoreIcon /> <span className="nav-label">Tienda</span>
            </Link>
            <Link to="/profile" className="nav-item-top">
              <UserIcon /> <span className="nav-label">Perfil</span>
            </Link>
          </nav>
        </div>
      </header>
      
      <main className="main-content" style={{ marginTop: '70px', paddingBottom: '20px' }}>
        {children}
      </main>
    </div>
  );
};

const DEV_LOGIN_EMAIL = import.meta.env.VITE_DEV_LOGIN_EMAIL;
const DEV_LOGIN_PASSWORD = import.meta.env.VITE_DEV_LOGIN_PASSWORD;

export const App = () => {
  const [user, setUser] = useState<any>(() => {
    const saved = localStorage.getItem('googleUser');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    const initSession = async () => {
      if (!ENABLE_GOOGLE_AUTH && !localStorage.getItem('authToken')) {
        try {
          let sessionUser, token;

          if (DEV_LOGIN_EMAIL && DEV_LOGIN_PASSWORD) {
            const response = await apiFetch('/auth/login', {
              method: 'POST',
              body: JSON.stringify({ email: DEV_LOGIN_EMAIL, password: DEV_LOGIN_PASSWORD }),
            });
            sessionUser = response.user;
            token = response.token;
          } else {
            const response = await apiFetch('/auth/guest', { method: 'POST' });
            sessionUser = response.user;
            token = response.token;
          }

          localStorage.setItem('googleUser', JSON.stringify(sessionUser));
          localStorage.setItem('authToken', token);
          setUser(sessionUser);
        } catch (error) {
          console.error('Error initializing session:', error);
        }
      }
    };
    initSession();
  }, []);

  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem('googleUser');
      setUser(saved ? JSON.parse(saved) : null);
    };
    window.addEventListener('storage', handleStorageChange);
    const interval = setInterval(handleStorageChange, 1000);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  return (
    <MeshProvider>
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <Routes>
          {ENABLE_GOOGLE_AUTH && !user ? (
            <Route path="*" element={<AppLayout user={user}><Login /></AppLayout>} />
          ) : (
            <>
              <Route path="/" element={<AppLayout user={user}><Home /></AppLayout>} />
              <Route path="/missions" element={<AppLayout user={user}><Missions /></AppLayout>} />
              <Route path="/store" element={<AppLayout user={user}><Store /></AppLayout>} />
              <Route path="/checkout/:productId" element={<AppLayout user={user}><Checkout /></AppLayout>} />
              <Route path="/profile" element={<AppLayout user={user}><Profile /></AppLayout>} />
              <Route path="/admin" element={
                user?.role === 'ADMIN' 
                  ? <AppLayout user={user}><AdminDashboard /></AppLayout> 
                  : <Navigate to="/" replace />
              } />
              <Route path="/merchant" element={
                user?.role === 'MERCHANT' || user?.role === 'ADMIN' 
                  ? <AppLayout user={user}><MerchantDashboard /></AppLayout> 
                  : <Navigate to="/" replace />
              } />
              <Route path="/login" element={<Navigate to="/" replace />} />
            </>
          )}
        </Routes>
      </GoogleOAuthProvider>
    </MeshProvider>
  );
};
