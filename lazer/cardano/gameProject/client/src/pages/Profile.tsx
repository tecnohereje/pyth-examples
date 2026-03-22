import { useState, useEffect } from 'react';
import { googleLogout } from '@react-oauth/google';
import { apiFetch } from '../utils/api';

interface UserSession {
  id: string;
  displayName: string;
  email: string;
  avatarUrl: string;
  javitosBalance: number;
}

export const Profile = () => {
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const data = await apiFetch('/user/me');
      setUser(data.user);
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleLogout = () => {
    googleLogout();
    setUser(null);
    localStorage.removeItem('googleUser');
    localStorage.removeItem('authToken');
    window.location.reload(); 
  };

  const avatarImage = (user && user.avatarUrl)
    ? user.avatarUrl 
    : `https://api.dicebear.com/7.x/identicon/svg?seed=${user?.id || 'CardanoExplorer_99'}`;

  if (loading) return <div className="p-10 text-center">Cargando perfil...</div>;

  return (
    <div className="p-4" style={{ paddingBottom: '80px', background: 'var(--color-bg)', minHeight: '100%' }}>
      
      <div className="flex flex-col items-center mt-6 mb-8 bg-surface p-6 rounded-3xl shadow-sm border border-border">
        <div style={{ position: 'relative' }}>
          <img 
            src={avatarImage} 
            alt="Avatar" 
            style={{ width: 120, height: 120, borderRadius: '50%', background: '#e0ece4', border: '4px solid var(--color-primary)', objectFit: 'cover' }} 
          />
        </div>
        <h2 className="mt-4 mb-1" style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
          {user ? user.displayName : 'Invitado'}
        </h2>
        {user && <span className="text-secondary" style={{ fontSize: '0.9rem' }}>{user.email}</span>}
        
        {user && (
          <div className="mt-6 w-full flex justify-center">
            <button 
              onClick={handleLogout}
              style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', padding: '0.6rem 2rem', borderRadius: '50px', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}
            >
              Cerrar Sesión
            </button>
          </div>
        )}
      </div>

      <div className="flex justify-center mb-8">
        <div className="bg-surface p-6 rounded-2xl shadow-sm text-center w-full max-w-[200px]" style={{ border: '1px solid var(--color-border)' }}>
          <h3 style={{ fontSize: '2.5rem', margin: 0, color: 'var(--color-primary)' }}>{user ? user.javitosBalance : 0}</h3>
          <span className="text-secondary" style={{ fontSize: '1rem', fontWeight: 'bold' }}>Javitos (JVT)</span>
        </div>
      </div>

      {!user && (
        <div className="bg-primary text-white p-4 rounded-2xl text-center shadow-lg" style={{ background: 'var(--gradient-primary)' }}>
           <h4 style={{ margin: '0 0 0.5rem 0' }}>¡Únete a la Revolución!</h4>
           <p style={{ margin: 0, fontSize: '0.85rem' }}>Inicia sesión con Google para empezar a acumular Javitos y canjear premios reales.</p>
        </div>
      )}
    </div>
  );
};
