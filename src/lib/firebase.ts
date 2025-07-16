// src/lib/firebase.ts
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getFirestore, Timestamp, type Firestore } from "firebase/firestore";
import { getAuth, type Auth } from "firebase/auth";

// These are the required variables from your .env.local file
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

// Check that all environment variables are present before initializing
if (Object.values(firebaseConfig).some(value => !value)) {
  console.error("Firebase initialization skipped. One or more environment variables are missing. Please check your .env.local file.");
  // Assign null to exports to prevent runtime errors on the server if they are accessed.
  // The application will show a clear state of being uninitialized on the client.
  // @ts-ignore
  app = null;
  // @ts-ignore
  auth = null;
  // @ts-ignore
  db = null;
} else {
  console.log('[Firebase] Initializing with config:', {
    apiKey: firebaseConfig.apiKey ? '***' : undefined,
    authDomain: firebaseConfig.authDomain,
    projectId: firebaseConfig.projectId,
  });
  // This robust initialization prevents re-initialization on hot reloads
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(app);
  db = getFirestore(app);
  console.log('[Firebase] Initialization successful.');
}

export { app, db, auth, Timestamp };
