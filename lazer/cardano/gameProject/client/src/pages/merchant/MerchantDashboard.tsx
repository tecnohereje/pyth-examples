import { useState, useEffect } from 'react';
import { apiFetch } from '../../utils/api';

interface Product {
  id: string;
  nameEs: string;
  priceUsd: number;
  javitosRequired: number;
  discountPercentage: number;
}

interface Order {
  id: string;
  txHash: string | null;
  priceAdaAtPurchase: number;
  priceUsdAtPurchase: number;
  javitosUsed: number;
  escrowStatus: string;
  createdAt: string;
  user: {
     displayName: string;
     email: string;
  };
  product: {
     nameEs: string;
  };
}

export const MerchantDashboard = () => {
  const [activeTab, setActiveTab] = useState<'inventory' | 'sales'>('inventory');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [productsData, ordersData] = await Promise.all([
        apiFetch('/merchant/my-products'),
        apiFetch('/merchant/my-orders')
      ]);
      setProducts(productsData);
      setOrders(ordersData);
    } catch (err) {
      console.error('Error fetching merchant data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) return <div className="p-10 text-center">Iniciando portal de negocios...</div>;

  return (
    <div className="p-4" style={{ backgroundColor: 'var(--color-bg)', minHeight: '100%', paddingBottom: '90px' }}>
      <h1 style={{ marginBottom: '0.5rem', fontWeight: '900' }}>Portal Merchant</h1>
      <p style={{ color: 'var(--color-text-secondary)', marginBottom: '2rem' }}>
        Tus ventas y productos en la red Cardano.
      </p>

      {/* Tabs */}
      <div className="flex gap-2" style={{ marginBottom: '2rem', borderBottom: '1px solid var(--color-border)' }}>
        <button 
          className={`flex-1 p-3 ${activeTab === 'inventory' ? 'border-b-2 border-primary' : ''}`}
          style={{ 
            background: 'none', border: 'none',
            borderBottom: activeTab === 'inventory' ? '2px solid var(--color-primary)' : '2px solid transparent',
            fontWeight: activeTab === 'inventory' ? 'bold' : 'normal',
            color: activeTab === 'inventory' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
          }}
          onClick={() => setActiveTab('inventory')}
        >
          Catálogo
        </button>
        <button 
          className={`flex-1 p-3 ${activeTab === 'sales' ? 'border-b-2 border-primary' : ''}`}
          style={{ 
            background: 'none', border: 'none',
            borderBottom: activeTab === 'sales' ? '2px solid var(--color-primary)' : '2px solid transparent',
            fontWeight: activeTab === 'sales' ? 'bold' : 'normal',
            color: activeTab === 'sales' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
          }}
          onClick={() => setActiveTab('sales')}
        >
          Ventas
        </button>
      </div>

      <div style={{ background: 'var(--color-surface)', padding: '1.5rem', borderRadius: '24px', border: '1px solid var(--color-border)' }}>
        {activeTab === 'inventory' && (
          <div>
            <div className="flex justify-between items-center mb-4">
               <h3 style={{ margin: 0 }}>Mis Productos</h3>
               <span style={{ fontSize: '0.8rem', color: 'var(--color-primary)' }}>{products.length} Items</span>
            </div>

            {products.map(p => (
              <div key={p.id} style={{ padding: '1.2rem', background: 'var(--color-bg)', borderRadius: '16px', marginBottom: '1rem', border: '1px solid var(--color-border)' }}>
                 <div className="flex justify-between font-bold">
                    <span>{p.nameEs}</span>
                    <span>${p.priceUsd.toFixed(2)}</span>
                 </div>
                 <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginTop: '0.5rem' }}>
                    Descuento: -{p.discountPercentage}% con {p.javitosRequired} JVT
                 </div>
              </div>
            ))}
            
            {products.length === 0 && <p className="text-secondary py-10 text-center">No tienes productos aún.</p>}
          </div>
        )}

        {activeTab === 'sales' && (
          <div>
            <h3 style={{ margin: '0 0 1.5rem 0' }}>Historial ADA Recibidos</h3>
            
            {orders.map(o => (
               <div key={o.id} style={{ padding: '1.2rem', background: 'var(--color-bg)', borderRadius: '16px', marginBottom: '1.5rem', border: '1px solid var(--color-border)' }}>
                  <div className="flex justify-between mb-2">
                     <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                        {new Date(o.createdAt).toLocaleDateString()}
                     </span>
                     <span style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', background: o.escrowStatus === 'LOCKED' ? 'var(--color-primary)' : '#ffcc00', border: 'none', borderRadius: '4px' }}>
                        {o.escrowStatus}
                     </span>
                  </div>
                  <div className="font-bold text-lg mb-1">{o.product.nameEs}</div>
                  <div className="text-sm text-secondary mb-3">Cliente: {o.user.displayName}</div>
                  
                  <div className="flex justify-between items-end">
                     <div>
                        <div style={{ fontWeight: 'black', fontSize: '1.2rem' }}>{o.priceAdaAtPurchase.toFixed(2)} ADA</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Usó {o.javitosUsed} JVT</div>
                     </div>
                     {o.txHash && (
                        <a 
                          href={`https://preprod.cardanoscan.io/transaction/${o.txHash}`} 
                          target="_blank" 
                          rel="noreferrer"
                          style={{ fontSize: '0.75rem', color: 'var(--color-primary)', textDecoration: 'underline' }}
                        >
                           Ver en CardanoScan ↗
                        </a>
                     )}
                  </div>
               </div>
            ))}

            {orders.length === 0 && <p className="text-secondary py-10 text-center">No hay ventas registradas.</p>}
          </div>
        )}
      </div>
    </div>
  );
};
