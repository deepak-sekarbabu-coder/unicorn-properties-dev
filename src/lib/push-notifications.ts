import { getMessaging, getToken } from 'firebase/messaging';

import { app } from './firebase-client';
import * as firestore from './firestore';

export const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      console.log('Service Worker registration successful, scope is:', registration.scope);
      return registration;
    } catch (err) {
      console.log('Service Worker registration failed, error:', err);
      throw err;
    }
  }
  return null;
};

export const requestNotificationPermission = async (userId: string) => {
  if (typeof window === 'undefined') return;

  const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

  // Ensure you have a valid VAPID key before proceeding.
  if (!VAPID_KEY || VAPID_KEY === 'YOUR_VAPID_KEY_HERE') {
    console.warn(
      'VAPID key not set. Push notifications will not work. Please set NEXT_PUBLIC_FIREBASE_VAPID_KEY in your environment variables.'
    );
    return;
  }

  try {
    const registration = await registerServiceWorker();
    if (!registration) {
      console.log('Service worker registration failed or not supported.');
      return;
    }
    const messaging = getMessaging(app);
    const permission = await Notification.requestPermission();

    if (permission === 'granted') {
      console.log('Notification permission granted.');
      const currentToken = await getToken(messaging, {
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration: registration,
      });

      if (currentToken) {
        console.log('FCM Token:', currentToken);
        // Save the token to Firestore
        await firestore.updateUser(userId, { fcmToken: currentToken });
      } else {
        console.log('No registration token available. Request permission to generate one.');
      }
    } else {
      console.log('Unable to get permission to notify.');
    }
  } catch (error) {
    console.error('Error requesting notification permission:', error);
  }
};
