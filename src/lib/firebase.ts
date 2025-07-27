// Import the functions you need from the SDKs you need
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getMessaging } from 'firebase/messaging';

// Your web app's Firebase configuration
const firebaseConfig = {
  projectId: 'apartmentshare',
  appId: '1:338329622668:web:37d896dbd78089bd2c03a9',
  storageBucket: 'apartmentshare.appspot.com',
  apiKey: 'AIzaSyCWYkxlDLpUny-WVpOsd6EcfQ3sU67A2Wc',
  authDomain: 'apartmentshare.firebaseapp.com',
  messagingSenderId: '338329622668',
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);
const messaging = typeof window !== 'undefined' ? getMessaging(app) : null;

export { db, auth, messaging, app };
