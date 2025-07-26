import { initializeApp, getApps, getApp } from 'firebase/app';

// Your web app's Firebase configuration
const firebaseConfig = {
  "projectId": "apartmentshare",
  "appId": "1:338329622668:web:37d896dbd78089bd2c03a9",
  "storageBucket": "apartmentshare.appspot.com",
  "apiKey": "AIzaSyCWYkxlDLpUny-WVpOsd6EcfQ3sU67A2Wc",
  "authDomain": "apartmentshare.firebaseapp.com",
  "messagingSenderId": "338329622668"
};

// Initialize Firebase
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
