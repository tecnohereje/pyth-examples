import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface Props {
  onScanSuccess: (decodedText: string) => void;
  onClose: () => void;
}

export const QRScanner = ({ onScanSuccess, onClose }: Props) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const scannerElementId = 'reader';
    let html5QrCode: Html5Qrcode | null = null;
    let isMounted = true;

    const cleanup = async () => {
      if (html5QrCode) {
        if (html5QrCode.isScanning) {
          try {
            await html5QrCode.stop();
          } catch (e) {
            console.warn('Error stopping scanner during cleanup', e);
          }
        }
        try {
          html5QrCode.clear();
        } catch (e) {
          console.warn('Error clearing scanner', e);
        }
      }
      const container = document.getElementById(scannerElementId);
      if (container) container.innerHTML = '';
    };

    const setup = async () => {
      // Forzar limpieza previa absoluta
      await cleanup();
      
      if (!isMounted) return;

      html5QrCode = new Html5Qrcode(scannerElementId);
      scannerRef.current = html5QrCode;

      try {
        await html5QrCode.start(
          { facingMode: 'environment' },
          {
            fps: 20,
            qrbox: (viewfinderWidth, viewfinderHeight) => {
              const minEdgeSize = Math.min(viewfinderWidth, viewfinderHeight);
              const qrboxSize = Math.floor(minEdgeSize * 0.7);
              return { width: qrboxSize, height: qrboxSize };
            },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            if (isMounted && html5QrCode) {
              html5QrCode.stop().then(() => {
                onScanSuccess(decodedText);
              }).catch(console.error);
            }
          },
          () => {} // Silent scan failures
        );
      } catch (err) {
        if (isMounted) {
          setError('No se pudo acceder a la cámara trasera. Verifica los permisos.');
          console.error(err);
        }
      }
    };

    setup();

    return () => {
      isMounted = false;
      cleanup();
    };
  }, [onScanSuccess]);

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.95)',
      zIndex: 999999,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      backdropFilter: 'blur(8px)'
    }}>
      <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '2rem', width: '92%', maxWidth: '400px', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
         <h3 style={{ marginTop: 0, textAlign: 'center', color: '#333', marginBottom: '1.5rem' }}>Escanea el Código QR</h3>
         {error ? (
           <p style={{ color: 'red', textAlign: 'center', fontWeight: 'bold' }}>{error}</p>
         ) : (
           <div id="reader" style={{ width: '100%', borderRadius: '1rem', overflow: 'hidden', backgroundColor: '#000' }}></div>
         )}
         <button className="btn-secondary" style={{ width: '100%', marginTop: '1.5rem', padding: '1rem', borderRadius: '12px', fontWeight: 'bold' }} onClick={onClose}>
           Cancelar
         </button>
      </div>
    </div>
  );
};
