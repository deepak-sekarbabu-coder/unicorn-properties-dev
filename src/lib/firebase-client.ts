import { getApp, getApps, initializeApp } from 'firebase/app';

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
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
