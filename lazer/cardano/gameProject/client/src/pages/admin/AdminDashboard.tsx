import { useState, useEffect } from 'react';
import { apiFetch } from '../../utils/api';

interface Stats {
  users: number;
  missions: number;
  orders: number;
  revenueAda: number;
}

interface UserAdmin {
  id: string;
  email: string;
  displayName: string;
  role: string;
  javitosBalance: number;
  walletAddress: string | null;
  createdAt: string;
}

export const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'missions' | 'settings'>('stats');
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<UserAdmin[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAdminData = async () => {
    try {
      const [statsData, usersData] = await Promise.all([
        apiFetch('/admin/stats'),
        apiFetch('/admin/users')
      ]);
      setStats(statsData);
      setUsers(usersData);
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  if (loading) return <div className="p-10 text-center">Cargando datos de administración...</div>;

  return (
    <div className="p-4" style={{ backgroundColor: 'var(--color-bg)', minHeight: '100%', paddingBottom: '100px' }}>
      <h1 style={{ marginBottom: '0.5rem', fontWeight: '900' }}>Admin Console</h1>
      <p style={{ color: 'var(--color-text-secondary)', marginBottom: '2rem' }}>
        Control total sobre el ecosistema Pythathon.
      </p>

      {/* Tabs */}
      <div className="flex gap-2" style={{ marginBottom: '2rem', borderBottom: '1px solid var(--color-border)', overflowX: 'auto' }}>
        {(['stats', 'users', 'missions', 'settings'] as const).map(tab => (
          <button 
            key={tab}
            className={`p-3 whitespace-nowrap ${activeTab === tab ? 'border-b-2 border-primary' : ''}`}
            style={{ 
              background: 'none', border: 'none',
              borderBottom: activeTab === tab ? '2px solid var(--color-primary)' : '2px solid transparent',
              fontWeight: activeTab === tab ? 'bold' : 'normal',
              color: activeTab === tab ? 'var(--color-primary)' : 'var(--color-text-secondary)',
              textTransform: 'capitalize'
            }}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'stats' ? 'Métricas' : tab === 'users' ? 'Usuarios' : tab === 'missions' ? 'Misiones' : 'Ajustes'}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ background: 'var(--color-surface)', padding: '1.5rem', borderRadius: '24px', border: '1px solid var(--color-border)' }}>
        {activeTab === 'stats' && stats && (
          <div className="grid grid-cols-2 gap-4">
            <div className="p-5 bg-bg rounded-2xl border border-border">
              <span className="text-secondary text-xs uppercase tracking-wider block mb-1">Total Usuarios</span>
              <div className="text-3xl font-black">{stats.users}</div>
            </div>
            <div className="p-5 bg-bg rounded-2xl border border-border">
              <span className="text-secondary text-xs uppercase tracking-wider block mb-1">Misiones</span>
              <div className="text-3xl font-black">{stats.missions}</div>
            </div>
            <div className="p-5 bg-bg rounded-2xl border border-border">
              <span className="text-secondary text-xs uppercase tracking-wider block mb-1">Órdenes Checkout</span>
              <div className="text-3xl font-black">{stats.orders}</div>
            </div>
            <div className="p-5 bg-bg rounded-2xl border border-border" style={{ borderColor: 'var(--color-primary)', background: 'rgba(var(--color-primary-rgb), 0.05)' }}>
              <span className="text-primary text-xs uppercase tracking-wider block mb-1 font-bold">Volumen ADA</span>
              <div className="text-3xl font-black color-primary">{stats.revenueAda.toFixed(2)} ₳</div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div style={{ overflowX: 'auto' }}>
             <h3 style={{ margin: '0 0 1.5rem 0' }}>Participantes</h3>
             <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                   <tr style={{ color: 'var(--color-text-secondary)', borderBottom: '1px solid var(--color-border)' }}>
                      <th style={{ padding: '0.75rem' }}>Nombre</th>
                      <th style={{ padding: '0.75rem' }}>Rol</th>
                      <th style={{ padding: '0.75rem' }}>Javitos</th>
                      <th style={{ padding: '0.75rem' }}>Status</th>
                   </tr>
                </thead>
                <tbody>
                   {users.map(u => (
                      <tr key={u.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                         <td style={{ padding: '1rem 0.75rem' }}>
                            <div className="font-bold">{u.displayName}</div>
                            <div className="text-xs text-secondary">{u.email}</div>
                         </td>
                         <td style={{ padding: '1rem 0.75rem' }}>
                            <span style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', background: 'var(--color-bg)', borderRadius: '6px' }}>{u.role}</span>
                         </td>
                         <td style={{ padding: '1rem 0.75rem' }} className="font-mono">{u.javitosBalance} JVT</td>
                         <td style={{ padding: '1rem 0.75rem' }}>
                            <span style={{ color: u.walletAddress ? 'var(--color-primary)' : 'var(--color-text-secondary)' }}>
                               {u.walletAddress ? '● Connected' : '○ Pending'}
                            </span>
                         </td>
                      </tr>
                   ))}
                </tbody>
             </table>
          </div>
        )}

        {activeTab === 'missions' && (
           <div className="text-center py-10">
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏗️</div>
              <h3 style={{ margin: 0 }}>Editor de Misiones</h3>
              <p className="text-secondary mt-2">La creación de misiones mediante formulario está en construcción académica.</p>
           </div>
        )}

        {activeTab === 'settings' && (
           <div className="text-center py-10">
              <p className="text-secondary">Configuración de Oráculo y Seguridad HMAC (Configurada en .env).</p>
           </div>
        )}
      </div>
    </div>
  );
};
