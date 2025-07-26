// This file must be in the public directory

// Scripts for firebase and firebase messaging
importScripts("https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js");
importScripts("https://www.gstatic.com/firebasejs/8.10.1/firebase-messaging.js");

// Your web app's Firebase configuration
const firebaseConfig = {
  "projectId": "apartmentshare",
  "appId": "1:338329622668:web:37d896dbd78089bd2c03a9",
  "storageBucket": "apartmentshare.appspot.com",
  "apiKey": "AIzaSyCWYkxlDLpUny-WVpOsd6EcfQ3sU67A2Wc",
  "authDomain": "apartmentshare.firebaseapp.com",
  "messagingSenderId": "338329622668"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log(
    "[firebase-messaging-sw.js] Received background message ",
    payload
  );
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: "/icon-192x192.png", // Make sure you have an icon file here
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
