// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, Timestamp } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// --- App Initialization with Safety Check ---

let app;
let db;

// Check if all required environment variables are present
const areFirebaseVarsDefined = 
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId;

if (!areFirebaseVarsDefined) {
  console.warn(`
    ###########################################################################
    # ATTENZIONE: Variabili d'ambiente Firebase non configurate.              #
    # L'applicazione non si connetterà a Firebase.                            #
    # Copia .env.example in .env e inserisci le tue chiavi Firebase.          #
    ###########################################################################
  `);
  // Use dummy objects if not configured, to avoid crashing the app
  app = null;
  db = null;
} else {
  // Initialize Firebase only if config is valid
  app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  db = getFirestore(app!);
}


export { app, db, Timestamp };
