// Import the functions you need from the SDKs you need
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getMessaging } from 'firebase/messaging';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyA7g7daznFO-dDWYv8-jT08DDZlJSFT1lE',
  authDomain: 'unicorndev-b532a.firebaseapp.com',
  projectId: 'unicorndev-b532a',
  storageBucket: 'unicorndev-b532a.firebasestorage.app',
  messagingSenderId: '1047490636656',
  appId: '1:1047490636656:web:851d9f253f1c7da6057db5',
};
// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);
const messaging = typeof window !== 'undefined' ? getMessaging(app) : null;

export { db, auth, messaging, app };
