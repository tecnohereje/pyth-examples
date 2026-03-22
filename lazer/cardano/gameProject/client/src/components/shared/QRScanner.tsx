import { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

interface QRScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onScanError?: (error: any) => void;
}

export const QRScanner = ({ onScanSuccess, onScanError }: QRScannerProps) => {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const [isScanning, setIsScanning] = useState(true);

  useEffect(() => {
    // Configuración del escáner
    scannerRef.current = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      /* verbose= */ false
    );

    scannerRef.current.render(
      (text) => {
        setIsScanning(false);
        if (scannerRef.current) {
          scannerRef.current.clear();
        }
        onScanSuccess(text);
      },
      (error) => {
        if (onScanError) onScanError(error);
      }
    );

    // Cleanup al desmontar
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
      }
    };
  }, [onScanSuccess, onScanError]);

  return (
    <div className="qr-scanner-container" style={{ width: '100%', maxWidth: '400px', margin: '0 auto' }}>
      {isScanning ? (
        <div id="reader" style={{ width: '100%' }}></div>
      ) : (
        <div className="text-center p-4">
          <p style={{ color: 'var(--color-success)', fontWeight: 'bold' }}>¡Código escaneado con éxito!</p>
          <button className="btn-primary" onClick={() => setIsScanning(true)}>Escanear otro código</button>
        </div>
      )}
    </div>
  );
};
