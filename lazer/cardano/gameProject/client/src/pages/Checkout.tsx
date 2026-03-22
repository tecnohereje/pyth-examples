import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PythOracleService, type PriceData } from '../blockchain/pyth';
import { apiFetch } from '../utils/api';
import { getAvailableWallets, connectWallet, buildAndSubmitPythPayment } from '../services/cardano';

const PYTH_TOKEN = import.meta.env.VITE_LAZER_TOKEN || 'DEMO_TOKEN';
const oracleService = new PythOracleService(PYTH_TOKEN);

interface Product {
  id: string;
  nameEs: string;
  nameEn: string;
  priceUsd: number;
  javitosRequired: number;
  discountPercentage: number;
}

export const Checkout = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  
  const [wallets, setWallets] = useState<Record<string, any>>({});
  const [selectedWalletKey, setSelectedWalletKey] = useState<string>('');
  const [connectedAddress, setConnectedAddress] = useState<string | null>(null);

  const [product, setProduct] = useState<Product | null>(null);
  const [userBalance, setUserBalance] = useState(0);
  const [adaPriceData, setAdaPriceData] = useState<PriceData | null>(null);
  const [applyDiscount, setApplyDiscount] = useState(true);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [paid, setPaid] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
     try {
        const [productsData, userData] = await Promise.all([
           apiFetch('/products'),
           apiFetch('/user/me')
        ]);
        const found = productsData.find((p: any) => p.id === productId);
        setProduct(found);
        setUserBalance(userData.user.javitosBalance);
     } catch (err) {
        console.error('Error fetching checkout data:', err);
        setError('No se pudo cargar la información del producto.');
     } finally {
        setLoading(false);
     }
  }, [productId]);

  const fetchAdaPrice = useCallback(async () => {
    try {
      const data = await oracleService.getLatestAdaUsdPrice();
      setAdaPriceData(data);
    } catch (err) {
      console.error("Error fetching price from Pyth:", err);
    }
  }, []);

  useEffect(() => {
    fetchData();
    fetchAdaPrice();
    setWallets(getAvailableWallets());

    const interval = setInterval(fetchAdaPrice, 30000);
    return () => clearInterval(interval);
  }, [fetchData, fetchAdaPrice]);

  const handleConnectWallet = async () => {
    if (!selectedWalletKey) return;
    try {
      setError(null);
      const address = await connectWallet(selectedWalletKey);
      setConnectedAddress(address);
    } catch (err: any) {
      console.error(err);
      setError("Error conectando wallet: " + err.message);
    }
  };

  const handlePayment = async () => {
    if (!product || !adaPriceData || !connectedAddress) return;

    setProcessing(true);
    setError(null);

    try {
      // 1. Calcular precios finales
      const finalUsd = applyDiscount 
        ? product.priceUsd * (1 - product.discountPercentage / 100) 
        : product.priceUsd;
      
      const adaAmount = finalUsd / adaPriceData.price;
      const lovelaceAmount = Math.floor(adaAmount * 1_000_000).toString();

      // 2. Crear la orden en el Backend (PENDING)
      const { orderId, merchantWallet } = await apiFetch('/products/order', {
         method: 'POST',
         body: JSON.stringify({
            productId: product.id,
            applyDiscount,
            priceAda: adaAmount,
            priceUsd: finalUsd
         })
      });

      // 3. Crear Transacción Blockchain con Evolution SDK y Validar Pyth
      const txHash = await buildAndSubmitPythPayment(
        merchantWallet,
        finalUsd,
        BigInt(lovelaceAmount)
      );

      // 4. Confirmar Pago en el Backend
      await apiFetch(`/products/order/${orderId}/confirm`, {
         method: 'POST',
         body: JSON.stringify({ txHash })
      });

      setPaid(true);
    } catch (err: any) {
      console.error("Payment failed:", err);
      setError(err.message || 'La transacción fue cancelada o falló.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div className="p-10 text-center">Cargando detalles de pago...</div>;
  if (!product) return <div className="p-10 text-center">Producto no encontrado</div>;

  const finalUsd = applyDiscount 
    ? product.priceUsd * (1 - product.discountPercentage / 100) 
    : product.priceUsd;
  
  const adaAmount = adaPriceData ? finalUsd / adaPriceData.price : 0;

  if (paid) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center" style={{ minHeight: '80vh' }}>
         <div style={{ fontSize: '5rem', marginBottom: '1.5rem' }}>🎫</div>
         <h2 style={{ fontSize: '2rem', color: 'var(--color-primary)', marginBottom: '1rem' }}>¡Pago Confirmado!</h2>
         <p className="text-secondary" style={{ fontSize: '1.2rem', marginBottom: '2rem' }}>
           Tu transacción se ha procesado exitosamente. Disfruta de tu <strong>{product.nameEs}</strong>.
         </p>
         <button className="btn-primary" style={{ width: '100%', maxWidth: '300px', padding: '1.2rem', borderRadius: '16px' }} onClick={() => navigate('/store')}>
           Volver a la Tienda
         </button>
      </div>
    );
  }

  return (
    <div className="flex justify-center w-full" style={{ background: 'var(--color-bg)', minHeight: '100vh' }}>
      <div className="w-full max-w-[600px]" style={{ padding: '2.5rem 1.5rem', paddingBottom: '100px' }}>
        <button 
          className="btn-secondary" 
          onClick={() => navigate('/store')} 
          style={{ padding: '0.6rem 1.2rem', fontSize: '0.9rem', marginBottom: '2.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: '12px' }}
        >
          ← Volver a la Tienda
        </button>

        <h1 style={{ margin: '0 0 2.5rem 0', fontSize: '2.5rem', fontWeight: '900', letterSpacing: '-1px' }}>Comprando</h1>

        <div className="bg-surface p-6 rounded-2xl shadow-sm border border-border" style={{ marginBottom: '2rem' }}>
          <h3 style={{ margin: '0 0 1rem 0' }}>{product.nameEs}</h3>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', background: 'var(--color-bg)', padding: '1rem', borderRadius: '12px' }}>
             <input 
               type="checkbox" 
               id="useJVT" 
               checked={applyDiscount} 
               onChange={(e) => setApplyDiscount(e.target.checked)}
               disabled={userBalance < product.javitosRequired}
             />
             <label htmlFor="useJVT" style={{ fontSize: '0.95rem' }}>
               {userBalance >= product.javitosRequired 
                  ? `Usar ${product.javitosRequired} JVT para un ${product.discountPercentage}% de descuento`
                  : `Javitos insuficientes (${userBalance}/${product.javitosRequired})`}
             </label>
          </div>

          <div className="flex justify-between items-center mb-2 text-secondary">
            <span>Precio Original (USD):</span>
            <span>${product.priceUsd.toFixed(2)}</span>
          </div>
          {applyDiscount && (
            <div className="flex justify-between items-center mb-2" style={{ color: 'var(--color-primary)' }}>
              <span>Descuento aplicado:</span>
              <span>-${(product.priceUsd * (product.discountPercentage / 100)).toFixed(2)}</span>
            </div>
          )}

          <hr style={{ border: 'none', borderTop: '1px dashed var(--color-border)', margin: '1.5rem 0' }} />

          <div className="flex justify-between items-center mb-4">
            <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>Total a pagar:</span>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>{adaAmount.toFixed(2)} ADA</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                Oráculo Pyth: 1 ADA = ${adaPriceData?.price.toFixed(4) || '...'}
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">
            ⚠️ {error}
          </div>
        )}

        <div className="bg-surface p-6 rounded-2xl shadow-sm border border-border text-center">
          {!connectedAddress ? (
             <>
               <p className="mb-4 text-secondary">Selecciona tu billetera Cardano para firmar (Preprod).</p>
               <div className="flex flex-col gap-3 max-w-sm mx-auto">
                 <select 
                   className="p-3 border border-border rounded-xl bg-surface"
                   value={selectedWalletKey}
                   onChange={(e) => setSelectedWalletKey(e.target.value)}
                 >
                   <option value="">Selecciona Billetera</option>
                   {Object.entries(wallets).map(([key, w]) => (
                     <option key={key} value={key}>{w.name}</option>
                   ))}
                 </select>
                 <button className="btn-primary p-3 rounded-xl" onClick={handleConnectWallet} disabled={!selectedWalletKey}>
                   Conectar
                 </button>
               </div>
             </>
          ) : (
             <button 
               className="btn-primary" 
               style={{ width: '100%', padding: '1.2rem', fontSize: '1.1rem', borderRadius: '16px', background: processing ? '#ccc' : 'var(--gradient-primary)' }}
               onClick={handlePayment}
               disabled={!adaPriceData || processing}
             >
               {processing ? 'Procesando (On-Chain)...' : `💳 Pagar ${adaAmount.toFixed(2)} ADA`}
             </button>
          )}
        </div>
      </div>
    </div>
  );
};
