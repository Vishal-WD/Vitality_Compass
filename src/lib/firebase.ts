// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyADrmwyKmf2o5vB5UXy_ocnM4BFKyfmyCQ",
  authDomain: "csp21-a0023.firebaseapp.com",
  projectId: "csp21-a0023",
  storageBucket: "csp21-a0023.appspot.com",
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
