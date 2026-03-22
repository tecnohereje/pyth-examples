import { GoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../utils/api';

export const Login = () => {
  const navigate = useNavigate();

  const handleLoginSuccess = async (credentialResponse: any) => {
    try {
      const { user, token } = await apiFetch('/auth/google', {
        method: 'POST',
        body: JSON.stringify({ idToken: credentialResponse.credential }),
      });

      localStorage.setItem('googleUser', JSON.stringify(user));
      localStorage.setItem('authToken', token);
      
      navigate('/');
      window.location.reload(); 
    } catch (error) {
      console.error('Error logging in with backend:', error);
      alert('Error al sincronizar con el servidor.');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-white p-6 relative overflow-hidden" 
         style={{ 
           background: `linear-gradient(rgba(15, 20, 25, 0.85), rgba(26, 35, 50, 0.85)), url('/src/assets/pythathon_login_bg.png')`,
           backgroundSize: 'cover',
           backgroundPosition: 'center',
         }}>
      
      {/* Elementos decorativos de fondo */}
      <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '40%', height: '40%', background: 'radial-gradient(circle, rgba(62,180,137,0.15) 0%, transparent 70%)', filter: 'blur(60px)', zIndex: 0 }}></div>
      <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '50%', height: '50%', background: 'radial-gradient(circle, rgba(0,123,167,0.15) 0%, transparent 70%)', filter: 'blur(60px)', zIndex: 0 }}></div>

      <div className="z-10 text-center max-w-md w-full animate-fadeIn">
        <div style={{ fontSize: '5rem', marginBottom: '1rem' }}>🛡️</div>
        <h1 style={{ fontSize: '3.5rem', margin: '0 0 1rem 0', fontWeight: '900', letterSpacing: '-2px', lineHeight: '1', background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          PYTHATHON
        </h1>
        <p style={{ fontSize: '1.2rem', color: 'rgba(255,255,255,0.7)', marginBottom: '3rem', lineHeight: '1.6' }}>
          La primera PWA gamificada sobre Cardano. Completa misiones, gana **Javitos** y canjea premios reales.
        </p>

        <div className="bg-surface p-8 rounded-3xl shadow-2xl border border-white/5 backdrop-blur-md" style={{ background: 'rgba(255,255,255,0.03)' }}>
          <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.1rem', color: 'white' }}>Inicia tu Aventura</h3>
          
          <div className="flex justify-center">
            <GoogleLogin
               onSuccess={handleLoginSuccess}
               onError={() => console.log('Login Failed')}
               useOneTap
               theme="filled_blue"
               shape="pill"
               width="100%"
            />
          </div>
          
          <p style={{ marginTop: '2rem', fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>
            Al entrar, aceptas compartir tu perfil público de Google para fines de identidad dentro del juego.
          </p>
        </div>

        <div className="mt-12 flex justify-center gap-6 opacity-50">
           <img src="https://cryptologos.cc/logos/cardano-ada-logo.png" alt="Cardano" style={{ width: 24, height: 24 }} />
           <img src="https://pyth.network/favicon.ico" alt="Pyth" style={{ width: 24, height: 24 }} />
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 1s ease-out forwards;
        }
      `}</style>
    </div>
  );
};
