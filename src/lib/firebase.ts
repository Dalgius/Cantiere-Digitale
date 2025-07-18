
// src/lib/firebase.ts
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getFirestore, Timestamp, type Firestore } from "firebase/firestore";
import { getAuth, type Auth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getStorage, type FirebaseStorage } from "firebase/storage";

// These are the required variables from your .env.local file
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;
let storage: FirebaseStorage | undefined;

// Check that all environment variables are present before initializing
if (Object.values(firebaseConfig).some(value => !value)) {
  console.error("Firebase initialization skipped. One or more environment variables are missing. Please check your .env.local file and Vercel/production environment variables.");
} else {
  console.log('[Firebase] Initializing with config:', {
    apiKey: firebaseConfig.apiKey ? '***' : undefined,
    authDomain: firebaseConfig.authDomain,
    projectId: firebaseConfig.projectId,
  });
  // This robust initialization prevents re-initialization on hot reloads
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  
  // Explicitly pass the storageBucket from the config
  storage = getStorage(app, firebaseConfig.storageBucket);
  
  auth = getAuth(app);
  db = getFirestore(app);

  // Set auth persistence to local storage if running in a browser environment
  if (typeof window !== "undefined" && auth) {
    setPersistence(auth, browserLocalPersistence)
      .catch((error) => {
          console.error("Firebase Auth persistence error:", error);
      });
  }

  console.log('[Firebase] Initialization successful.');
}

export { app, db, auth, storage, Timestamp };
