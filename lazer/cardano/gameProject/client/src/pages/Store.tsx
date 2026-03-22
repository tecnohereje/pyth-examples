import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../utils/api';

interface Product {
  id: string;
  nameEs: string;
  nameEn: string;
  descriptionEs: string;
  descriptionEn: string;
  priceUsd: number;
  javitosRequired: number;
  discountPercentage: number;
  imageUrl: string | null;
  videoUrl?: string; 
}

export const Store = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [userBalance, setUserBalance] = useState(0);

  const fetchData = async () => {
    try {
      const [productsData, userData] = await Promise.all([
        apiFetch('/products'),
        apiFetch('/user/me')
      ]);
      setProducts(productsData);
      setUserBalance(userData.user.javitosBalance);
    } catch (err) {
      console.error('Error fetching store data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) return <div className="p-10 text-center">Cargando catálogo...</div>;

  return (
    <div className="p-4" style={{ backgroundColor: 'var(--color-bg)', minHeight: '100%', paddingBottom: '90px' }}>
      <div className="flex justify-between items-center mb-6 mt-4">
        <h1 style={{ margin: 0, fontSize: '1.8rem' }}>Tienda</h1>
        <div style={{ background: 'var(--color-surface)', padding: '0.6rem 1.2rem', borderRadius: 'var(--radius-full)', fontWeight: 'bold', color: 'var(--color-primary-dark)', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
          {userBalance} JVT
        </div>
      </div>

      <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem', lineHeight: '1.5', fontSize: '1.05rem' }}>
        Canjea tus Javitos por coleccionables exclusivos. Elige un producto para ver detalles multimedia.
      </p>

      {/* Catálogo de Productos */}
      <div className="flex-col gap-5">
        {products.map((product) => (
          <div key={product.id} className="bg-surface shadow-md overflow-hidden" style={{ borderRadius: '16px', marginBottom: '1.5rem', border: '1px solid var(--color-border)', transition: 'transform 0.2s' }}>
            
            {product.imageUrl && (
              <img src={product.imageUrl} alt={product.nameEs} style={{ width: '100%', height: '170px', objectFit: 'cover' }} />
            )}
            
            <div style={{ padding: '1.5rem' }}>
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.35rem' }}>{product.nameEs}</h3>
              <div className="flex justify-between items-center mb-4">
                <span style={{ color: 'var(--color-primary-dark)', fontWeight: 'bold', fontSize: '0.9rem' }}>
                  Ahorro: {product.javitosRequired} JVT
                </span>
              </div>

              <button 
                className="btn-primary" 
                style={{ width: '100%', padding: '1.1rem', fontSize: '1.05rem', borderRadius: '12px' }}
                onClick={() => setSelectedProduct(product)}
              >
                Ver
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* PRODUCT DETAILS OVERLAY */}
      {selectedProduct && (
        <div 
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(5px)', padding: '1.5rem' }}
          onClick={() => setSelectedProduct(null)}
        >
           <div 
             style={{ background: 'var(--color-surface)', width: '100%', maxWidth: '450px', borderRadius: '24px', padding: '0', overflow: 'hidden', animation: 'fadeIn 0.3s ease-out', boxShadow: '0 20px 50px rgba(0,0,0,0.3)' }}
             onClick={(e) => e.stopPropagation()}
           >
              
              <div style={{ position: 'relative' }}>
                {selectedProduct.imageUrl && (
                  <img src={selectedProduct.imageUrl} alt={selectedProduct.nameEs} style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
                )}
                <button style={{ position: 'absolute', top: 15, right: 15, background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', width: '36px', height: '36px', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} onClick={() => setSelectedProduct(null)}>✕</button>
              </div>

              <div style={{ padding: '2rem 1.5rem', maxHeight: '70vh', overflowY: 'auto' }}>
                <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.5rem' }}>{selectedProduct.nameEs}</h2>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '1.5rem' }}>
                   {selectedProduct.descriptionEs}
                </p>

                {/* Video Embed */}
                {selectedProduct.videoUrl && (
                  <div style={{ marginBottom: '1.5rem' }}>
                    <p style={{ fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '0.5rem' }}>📽️ Demo del Producto:</p>
                    <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, borderRadius: '12px', overflow: 'hidden' }}>
                      <iframe 
                        src={selectedProduct.videoUrl}
                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      ></iframe>
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--color-bg)', padding: '1rem', borderRadius: '12px', marginBottom: '2rem' }}>
                   <div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>Precio aprox.</span>
                      <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>${selectedProduct.priceUsd.toFixed(2)}</div>
                   </div>
                   <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--color-primary)' }}>Descuento JVT</span>
                      <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>-{selectedProduct.discountPercentage}%</div>
                   </div>
                </div>

                <button 
                   className="btn-primary" 
                   style={{ width: '100%', padding: '1.1rem', fontSize: '1.1rem', borderRadius: '12px', background: 'var(--gradient-primary)' }}
                   onClick={() => navigate(`/checkout/${selectedProduct.id}`)}
                >
                   Ir al Checkout
                </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
