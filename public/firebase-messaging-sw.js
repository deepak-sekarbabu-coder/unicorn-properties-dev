// This file must be in the public directory

// Scripts for firebase and firebase messaging
importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-messaging.js');

// Fetch Firebase config from public config file
fetch('/firebase-config.json')
  .then(response => response.json())
  .then(firebaseConfig => {
    firebase.initializeApp(firebaseConfig);
    const messaging = firebase.messaging();

    messaging.onBackgroundMessage(payload => {
      console.log('[firebase-messaging-sw.js] Received background message ', payload);

      const notificationTitle = payload.notification.title;
      const notificationOptions = {
        body: payload.notification.body,
        icon: '/icon-192x192.png', // Make sure you have an icon file here
      };

      self.registration.showNotification(notificationTitle, notificationOptions);
    });
  })
  .catch(error => {
    console.error('Failed to load Firebase config:', error);
  });
