import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../utils/api';

export interface MissionMock {
  id: string;
  titleEs: string;
  titleEn: string;
  type: string;
  descriptionEs: string;
  javitosReward: number;
}

export const Home = () => {
  const navigate = useNavigate();

  const [missions, setMissions] = useState<MissionMock[]>([]);
  const [userProgress, setUserProgress] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<'available' | 'inprogress' | 'completed'>(() => {
    const saved = localStorage.getItem('missionsActiveTab');
    return (saved as 'available' | 'inprogress' | 'completed') || 'available';
  });
  const [selectedMission, setSelectedMission] = useState<any | null>(null);
  const [acceptedOverlay, setAcceptedOverlay] = useState<any | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await apiFetch('/missions');
      setMissions(data.missions);
      setUserProgress(data.userProgress);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Persist tab choice
  useEffect(() => {
    localStorage.setItem('missionsActiveTab', activeTab);
  }, [activeTab]);

  const filteredMissions = missions.filter(m => {
     const hasProgress = userProgress.find(p => p.missionId === m.id);
     if (activeTab === 'available') return !hasProgress;
     if (activeTab === 'inprogress') return hasProgress && (hasProgress.status === 'ACCEPTED' || hasProgress.status === 'IN_PROGRESS');
     if (activeTab === 'completed') return hasProgress && hasProgress.status === 'COMPLETED';
     return false;
  });

  const acceptMission = async (m: any) => {
    try {
      await apiFetch(`/missions/${m.id}/accept`, { method: 'POST' });
      localStorage.setItem('activeMission', JSON.stringify({
        id: m.id,
        name: m.titleEs,
        reward: m.javitosReward,
        type: m.type === 'MAIN' ? 'location' : 'verification' // Mapeo temporal
      }));
      setAcceptedOverlay(m);
      setSelectedMission(null);
      await fetchData(); // Recargar estado
      setActiveTab('inprogress');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const resumeMission = (m: any) => {
     localStorage.setItem('activeMission', JSON.stringify({
        id: m.id,
        name: m.titleEs,
        reward: m.javitosReward,
        type: m.type === 'MAIN' ? 'location' : 'verification'
     }));
     navigate('/missions');
  };

  if (loading) return <div className="p-10 text-center">Cargando tablero...</div>;

  return (
    <div className="flex-col h-full w-full relative" style={{ paddingBottom: '90px' }}>
      
      <div className="p-4 text-center bg-surface pt-6 pb-2">
        <h2 style={{margin: '0', fontSize: '1.8rem', color: 'var(--color-text)'}}>🎯 Misiones</h2>
        <p className="text-secondary mt-2 mb-0" style={{ fontSize: '0.9rem' }}>Elige tus objetivos y gana Javitos</p>
      </div>

      <div className="flex justify-center bg-surface pb-4 pt-2 shadow-sm" style={{ borderBottom: '1px solid var(--color-border)', position: 'sticky', top: 70, zIndex: 10 }}>
         <div className="flex gap-4 w-full px-4" style={{ maxWidth: '600px' }}>
           <button 
             onClick={() => setActiveTab('available')} 
             style={{ flex: 1, padding: '0.75rem', borderRadius: '12px', border: activeTab === 'available' ? '2px solid var(--color-primary)' : '1px solid var(--color-border)', background: activeTab === 'available' ? 'rgba(62, 180, 137, 0.1)' : 'transparent', color: activeTab === 'available' ? 'var(--color-primary)' : 'var(--color-text-secondary)', fontWeight: 'bold', transition: 'all 0.2s' }}
           >Nuevas</button>
           <button 
             onClick={() => setActiveTab('inprogress')} 
             style={{ flex: 1, padding: '0.75rem', borderRadius: '12px', border: activeTab === 'inprogress' ? '2px solid var(--color-primary)' : '1px solid var(--color-border)', background: activeTab === 'inprogress' ? 'rgba(62, 180, 137, 0.1)' : 'transparent', color: activeTab === 'inprogress' ? 'var(--color-primary)' : 'var(--color-text-secondary)', fontWeight: 'bold', transition: 'all 0.2s' }}
           >En Curso</button>
           <button 
             onClick={() => setActiveTab('completed')} 
             style={{ flex: 1, padding: '0.75rem', borderRadius: '12px', border: activeTab === 'completed' ? '2px solid var(--color-primary)' : '1px solid var(--color-border)', background: activeTab === 'completed' ? 'rgba(62, 180, 137, 0.1)' : 'transparent', color: activeTab === 'completed' ? 'var(--color-primary)' : 'var(--color-text-secondary)', fontWeight: 'bold', transition: 'all 0.2s' }}
           >Logradas</button>
         </div>
      </div>

      <div className="p-4" style={{ backgroundColor: 'var(--color-bg)', flex: 1, zIndex: 1 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '600px', margin: '0 auto', marginTop: '1rem' }}>
          {filteredMissions.length === 0 ? (
             <p className="text-secondary text-center mt-8">No hay misiones coincidentes.</p>
          ) : (
            filteredMissions.map((m) => (
              <div key={m.id} className="bg-surface shadow-md" style={{ padding: '1.5rem', border: '1px solid var(--color-border)', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'transform 0.2s' }}>
                <div style={{ paddingRight: '1rem' }}>
                  <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.15rem' }}>
                    {m.type === 'MAIN' && '📍 '}
                    {m.type === 'SIDE' && '🧩 '}
                    {m.type === 'DAILY' && '🤝 '}
                    {m.titleEs}
                  </h3>
                  <div style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                    {activeTab === 'completed' ? `✅ ${m.javitosReward} JVT Ganados` : `⏳ Misión Activa`}
                  </div>
                </div>
                {activeTab !== 'completed' && (
                   <button className="btn-primary" style={{ padding: '0.6rem 1rem', fontSize: '0.9rem', borderRadius: '8px', minWidth: '110px' }} onClick={() => setSelectedMission(m)}>
                     Ver
                   </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {selectedMission && !acceptedOverlay && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 99999, display: 'flex', alignItems: 'flex-end', backdropFilter: 'blur(4px)' }}>
           <div style={{ background: 'var(--color-surface)', width: '100%', borderTopLeftRadius: '32px', borderTopRightRadius: '32px', padding: '2.5rem 1.5rem', animation: 'slideUp 0.3s ease-out', boxShadow: '0 -10px 40px rgba(0,0,0,0.2)' }}>
              
              <div className="flex justify-between items-start mb-6">
                 <div>
                   <h2 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--color-text)' }}>{selectedMission.titleEs}</h2>
                   <div style={{ fontSize: '0.9rem', color: 'var(--color-primary)', fontWeight: 'bold', marginTop: '0.5rem' }}>+ {selectedMission.javitosReward} Javitos</div>
                 </div>
                 <button style={{ fontSize: '1.5rem', cursor: 'pointer', padding: '0.5rem', background: 'var(--color-bg)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setSelectedMission(null)}>✕</button>
              </div>
              
              <div style={{ background: 'var(--color-bg)', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem' }}>
                 <p style={{ margin: 0, fontWeight: 'bold', fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>DINÁMICA DE LA MISIÓN</p>
                 <p style={{ margin: '0.25rem 0 0 0', fontSize: '1rem', color: 'var(--color-text)' }}>
                    {selectedMission.type === 'MAIN' && 'Requiere traslado GPS y escaneo QR in-situ.'}
                    {selectedMission.type === 'SIDE' && 'Acertijo detectivesco por el recinto. Rastrea el QR.'}
                    {selectedMission.type === 'DAILY' && 'Validación personal. Genera tu código y muéstralo a un Merchant.'}
                 </p>
              </div>

              <p style={{ color: 'var(--color-text-secondary)', lineHeight: '1.7', fontSize: '1.05rem', marginBottom: '2rem' }}>
                {selectedMission.descriptionEs}
              </p>

              {userProgress.find(p => p.missionId === selectedMission.id) ? (
                <button 
                  className="btn-primary" 
                  style={{ width: '100%', fontSize: '1.15rem', padding: '1.25rem', borderRadius: '16px' }}
                  onClick={() => resumeMission(selectedMission)}
                >
                   Continuar Misión
                </button>
              ) : (
                <button 
                  className="btn-primary" 
                  style={{ width: '100%', fontSize: '1.15rem', padding: '1.25rem', borderRadius: '16px', background: 'var(--gradient-primary)' }}
                  onClick={() => acceptMission(selectedMission)}
                >
                   Aceptar Misión
                </button>
              )}
           </div>
        </div>
      )}

      {acceptedOverlay && (
         <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(255,255,255,0.95)', zIndex: 99999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.4s ease-out' }}>
            <div style={{ fontSize: '5rem', marginBottom: '1rem', animation: 'bounce 2s infinite' }}>
              {acceptedOverlay.type === 'location' && '🗺️'}
              {acceptedOverlay.type === 'riddle' && '🕵️‍♂️'}
              {acceptedOverlay.type === 'verification' && '🛡️'}
            </div>
            <h1 style={{ color: 'var(--color-primary)', fontSize: '2.5rem', margin: '0 0 1rem 0', textAlign: 'center' }}>¡Misión Aceptada!</h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.1rem', textAlign: 'center', maxWidth: '80%', marginBottom: '3rem' }}>
              Acabas de aceptar <strong>{acceptedOverlay.titleEs}</strong>. Ve a tu consola de Misión para ver los detalles operativos.
            </p>
            <button className="btn-primary" style={{ padding: '1rem 3rem', fontSize: '1.2rem', borderRadius: '50px', boxShadow: '0 10px 20px rgba(62,180,137,0.3)' }} onClick={() => {
                 setAcceptedOverlay(null);
                 navigate('/missions');
            }}>
              Ir a la Misión
            </button>
         </div>
      )}
    </div>
  );
};
