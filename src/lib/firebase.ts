// src/lib/firebase.ts

// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, Timestamp } from "firebase/firestore";
import { getAuth, connectAuthEmulator } from "firebase/auth";

// These are the required variables from your .env file
const requiredEnvVars = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

let app;

// Initialize Firebase only if all env vars are present
if (missingVars.length === 0) {
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
} else {
    console.warn(`Firebase initialization skipped. Missing environment variables: ${missingVars.join(', ')}. Please check your .env file.`);
    app = null; // Explicitly set to null if initialization is skipped
}


// Initialize services, they will be null if app initialization failed.
const db = app ? getFirestore(app) : null;
const auth = app ? getAuth(app) : null;


export { app, db, auth, Timestamp };
