self.addEventListener('push', function (e) {
  const data = e.data ? e.data.json() : { title: 'Pythathon', body: 'Tienes una nueva notificación' };

  const options = {
    body: data.body,
    icon: '/pythathon-logo-192.png', // Add a mock logo icon path
    badge: '/badge.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '1'
    }
  };

  e.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', function (e) {
  const notification = e.notification;
  const action = e.action;

  if (action === 'close') {
    notification.close();
  } else {
    clients.openWindow('http://localhost:5173');
    notification.close();
  }
});
