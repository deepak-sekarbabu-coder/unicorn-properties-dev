import { getMessaging, getToken } from 'firebase/messaging';

import { app } from './firebase-client';
// Using a client-side initialized app
import * as firestore from './firestore';

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
    const messaging = getMessaging(app);
    const permission = await Notification.requestPermission();

    if (permission === 'granted') {
      console.log('Notification permission granted.');
      const currentToken = await getToken(messaging, {
        vapidKey: VAPID_KEY,
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
    console.error('An error occurred while retrieving token. ', error);
  }
};
