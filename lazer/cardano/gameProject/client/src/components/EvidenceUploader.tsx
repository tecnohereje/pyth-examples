import { useRef, useState } from 'react';

interface Props {
  onSubmit: (file: File) => void;
  onClose: () => void;
}

export const EvidenceUploader = ({ onSubmit, onClose }: Props) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const objUrl = URL.createObjectURL(selectedFile);
      setPreview(objUrl);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.9)',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      <div style={{ background: 'var(--color-surface)', padding: '1.5rem', borderRadius: '1rem', width: '90%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
         <h3 style={{ margin: 0, textAlign: 'center' }}>Tomar Foto de Evidencia</h3>
         
         <div 
           style={{ 
             width: '100%', 
             height: '250px', 
             border: '2px dashed var(--color-border)', 
             borderRadius: 'var(--radius-md)',
             display: 'flex',
             alignItems: 'center',
             justifyContent: 'center',
             overflow: 'hidden',
             background: '#f8f8f8',
             cursor: 'pointer'
           }}
           onClick={() => inputRef.current?.click()}
         >
           {preview ? (
             <img src={preview} alt="Evidence preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
           ) : (
             <span style={{ color: 'var(--color-text-secondary)' }}>Toca aquí para abrir Cámara</span>
           )}
         </div>

         {/* accept environment camera natively via PWA */}
         <input 
           type="file" 
           accept="image/*" 
           capture="environment" 
           ref={inputRef}
           onChange={handleCapture}
           style={{ display: 'none' }}
         />

         <div className="flex gap-2">
           <button className="btn-secondary" style={{ flex: 1 }} onClick={onClose}>Cancelar</button>
           <button 
             className="btn-primary" 
             style={{ flex: 1 }} 
             disabled={!file}
             onClick={() => file && onSubmit(file)}
           >
             Subir
           </button>
         </div>
      </div>
    </div>
  );
};
