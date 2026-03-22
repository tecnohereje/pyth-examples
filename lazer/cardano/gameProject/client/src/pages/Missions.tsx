import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRScanner } from '../components/QRScanner';
import { EvidenceUploader } from '../components/EvidenceUploader';
import { apiFetch } from '../utils/api';

export const Missions = () => {
  const navigate = useNavigate();
  const [activeMission, setActiveMission] = useState<any | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [showEvidence, setShowEvidence] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [invalidQr, setInvalidQr] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const scannerTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('activeMission');
    if (saved) {
      setActiveMission(JSON.parse(saved));
    }
    setLoading(false);
  }, []);

  // Apagar cámara tras 60 segundos de inactividad
  useEffect(() => {
    if (showScanner) {
      scannerTimeoutRef.current = setTimeout(() => {
        setShowScanner(false);
      }, 60000);
    } else {
      if (scannerTimeoutRef.current) clearTimeout(scannerTimeoutRef.current);
    }
    return () => {
      if (scannerTimeoutRef.current) clearTimeout(scannerTimeoutRef.current);
    };
  }, [showScanner]);

  const handleOpenGoogleMaps = useCallback(() => {
    if (activeMission && activeMission.lat && activeMission.lng) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${activeMission.lat},${activeMission.lng}&travelmode=walking&zoom=15`;
      window.open(url, '_blank');
    }
  }, [activeMission]);

  const handleScanSuccess = useCallback(async (text: string) => {
     if (!activeMission) return;
     
     // Obtener ubicación GPS actual (Promesa para facilitar async/await)
     const getLocation = () => new Promise<{lat: number, lng: number} | null>((resolve) => {
        if (!navigator.geolocation) return resolve(null);
        navigator.geolocation.getCurrentPosition(
           (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
           () => resolve(null),
           { enableHighAccuracy: true, timeout: 5000 }
        );
     });

     try {
        const coords = await getLocation();
        
        await apiFetch(`/missions/${activeMission.id}/complete`, {
           method: 'POST',
           body: JSON.stringify({ 
              qrCode: text,
              lat: coords?.lat,
              lng: coords?.lng
           })
        });
        
        setShowScanner(false);
        setCompleted(true);
        localStorage.removeItem('activeMission');
     } catch (error: any) {
        // El backend puede devolver errores de distancia o firma
        setInvalidQr(true);
     }
  }, [activeMission]);

  const handleEvidenceSubmit = useCallback((_file: File) => {
    setShowEvidence(false);
    setCompleted(true);
    localStorage.removeItem('activeMission');
  }, []);

  if (loading) return <div className="p-10 text-center">Iniciando consola de misión...</div>;

  if (!activeMission) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 text-center">
         <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📭</div>
         <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Sin Misión Activa</h2>
         <p className="text-secondary mb-6">Aún no has aceptado ninguna misión de campo. Ve al tablero principal para elegir tu próximo objetivo.</p>
         <button className="btn-primary" style={{ padding: '0.75rem 2rem', borderRadius: '12px' }} onClick={() => navigate('/')}>
           Ir al Tablero
         </button>
      </div>
    );
  }

  if (completed) {
     return (
       <div className="flex flex-col items-center justify-center h-full p-6 text-center" style={{ background: 'var(--color-bg)' }}>
          <div style={{ fontSize: '5rem', marginBottom: '1.5rem', animation: 'bounce 2s infinite' }}>🏆</div>
          <h2 style={{ fontSize: '2rem', color: 'var(--color-primary)', marginBottom: '1rem' }}>¡Misión Superada!</h2>
          <p className="text-secondary" style={{ fontSize: '1.2rem', marginBottom: '2rem', lineHeight: '1.6' }}>
            Excelente trabajo. Has completado exitosamente <strong>{activeMission.name}</strong> y se te han acreditado los Javitos en tu balance.
          </p>
          <button className="btn-primary" style={{ padding: '1rem 3rem', borderRadius: '50px', width: '100%', maxWidth: '300px' }} onClick={() => navigate('/')}>
            Volver al Tablero
          </button>
       </div>
     );
  }

  return (
    <div className="h-full flex flex-col relative" style={{ background: 'var(--color-bg)' }}>
      {/* Overlay de Error QR */}
      {invalidQr && (
         <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(239, 68, 68, 0.9)', zIndex: 100000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white', padding: '2rem', textAlign: 'center', animation: 'fadeIn 0.3s' }}>
            <div style={{ fontSize: '5rem', marginBottom: '1rem' }}>⚠️</div>
            <h2 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem' }}>Código Inválido</h2>
            <p style={{ fontSize: '1.1rem', marginBottom: '2rem' }}>Este código QR no corresponde a tu misión actual o es incorrecto.</p>
            <button className="btn-secondary" style={{ background: 'white', color: '#ef4444', padding: '0.75rem 2rem', borderRadius: '12px' }} onClick={() => setInvalidQr(false)}>Reintentar</button>
         </div>
      )}

      {/* Header Misión */}
      <div className="p-6 bg-surface shadow-sm border-b border-border">
        <div className="flex items-center gap-3 mb-2">
          <span className="badge-primary">{activeMission.type === 'location' ? 'Misión de Campo' : 'Validación'}</span>
        </div>
        <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: '900' }}>{activeMission.name}</h1>
      </div>

      <div className="flex-1 p-6 overflow-y-auto" style={{ paddingBottom: '120px' }}>
        <div className="bg-surface p-5 rounded-2xl border border-border mb-6">
          <h3 className="mb-3">Tu Objetivo</h3>
          <p className="text-secondary" style={{ lineHeight: '1.6' }}>
            {activeMission.type === 'location' 
              ? 'Dirígete al punto exacto marcado en tu mapa secreto. Una vez allí, busca el código QR de Pythathon para validar tu presencia.'
              : 'Busca a un Organizador o Merchant certificado en el evento para que valide tu progreso escaneando el código correspondiente.'}
          </p>
        </div>

        {activeMission.lat && (
          <div className="bg-surface p-5 rounded-2xl border border-border mb-6">
            <h3 className="mb-4">Herramientas de Navegación</h3>
            <button 
              className="btn-secondary w-full" 
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', padding: '1rem', borderRadius: '16px' }}
              onClick={handleOpenGoogleMaps}
            >
              <span style={{ fontSize: '1.25rem' }}>📍</span> Abrir en Google Maps
            </button>
          </div>
        )}

        {activeMission.clues && (
          <div className="bg-surface p-5 rounded-2xl border border-border mb-6">
            <h3 className="mb-4">Pistas del Oráculo</h3>
            <div className="flex flex-col gap-3">
              {activeMission.clues.map((clue: any, idx: number) => (
                <div key={idx} className="p-3 bg-bg rounded-lg text-secondary italic">" {clue} "</div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-surface border-t border-border flex gap-4 drawer-shadow" style={{ zIndex: 100 }}>
        <button 
          className="btn-primary flex-1" 
          style={{ padding: '1.25rem', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', fontSize: '1.1rem' }}
          onClick={() => setShowScanner(true)}
        >
          <span style={{ fontSize: '1.25rem' }}>📷</span> Escanear QR
        </button>
      </div>

      {/* QR Scanner Overlay */}
      {showScanner && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'black', zIndex: 1000, display: 'flex', flexDirection: 'column' }}>
           <div className="p-6 flex justify-between items-center text-white" style={{ position: 'absolute', top: 0, width: '100%', zIndex: 1001 }}>
              <h2 style={{ margin: 0 }}>Validación QR</h2>
              <button 
                style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '0.5rem 1rem', borderRadius: '8px' }}
                onClick={() => setShowScanner(false)}
              >Cerrar</button>
           </div>
           <QRScanner onScanSuccess={handleScanSuccess} onClose={() => setShowScanner(false)} />
           <div style={{ position: 'absolute', bottom: '10%', width: '100%', textAlign: 'center', color: 'white', padding: '1rem', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
              Apunta al código QR de la misión
           </div>
        </div>
      )}

      {/* Evidence Uploader Overlay (Para misiones tipo PHOTO) */}
      {showEvidence && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'var(--color-bg)', zIndex: 1000, padding: '2rem' }}>
          <EvidenceUploader 
            onSubmit={handleEvidenceSubmit}
            onClose={() => setShowEvidence(false)}
          />
        </div>
      )}
    </div>
  );
};
