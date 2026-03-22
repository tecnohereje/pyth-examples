function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function subscribeUserToPush() {
  if (!('serviceWorker' in navigator)) {
    console.log('Service Worker no es soportado');
    return;
  }
  if (!('PushManager' in window)) {
    console.log('Push API no soportada');
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const publicVapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
    if (!publicVapidKey) throw new Error('Llave Vapid no configurada');

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
    });

    console.log('Suscripción exitosa a Web Push:', subscription);

    // Enviar suscripción al backend
    await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/notifications/subscribe`, {
      method: 'POST',
      body: JSON.stringify(subscription),
      headers: {
        'Content-Type': 'application/json',
        // 'Authorization': `Bearer ${localStorage.getItem('token')}` // asumiendo token
      }
    });

    return true;
  } catch (err) {
    console.error('Fallo al suscribirse a Push Notifications', err);
    return false;
  }
}
