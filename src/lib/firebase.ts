// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAOP9Q04fOzNOrzT1Tu24uB96m1zvbtdzc",
  authDomain: "csp21-a0023.firebaseapp.com",
  databaseURL: "https://csp21-a0023-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "csp21-a0023",
  storageBucket: "csp21-a0023.firebasestorage.app",
  messagingSenderId: "228527630242",
  appId: "1:228527630242:web:1811bf5b68c1d2ea4874fb",
  measurementId: "G-R38L26WKVP"
};

// Log the config to the browser console to help with debugging.
console.log('Firebase Config:', firebaseConfig);

// Initialize Firebase
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);


export { app, auth, db };
