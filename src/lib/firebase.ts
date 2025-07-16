
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, Timestamp } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// These are the required variables from your .env file
const requiredEnvVars = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID'
];

// Check if all required environment variables are set
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

let app;

if (missingVars.length > 0) {
  console.warn(`Firebase initialization skipped. Missing environment variables: ${missingVars.join(', ')}. Please check your .env file.`);
  // Set app to null or a mock object if needed, to prevent crashes elsewhere
  app = null;
} else {
  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: `${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.firebaseapp.com`,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: `${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.appspot.com`,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
  };
  
  // This robust initialization prevents re-initialization on hot reloads
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
}


// Initialize services only if Firebase app was initialized successfully
const db = app ? getFirestore(app) : null;
const auth = app ? getAuth(app) : null;


export { app, db, auth, Timestamp };
