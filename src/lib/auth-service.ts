
// src/lib/auth-service.ts
'use server';

import { signOut } from 'firebase/auth';
import { auth } from './firebase';

// Sign-in and sign-up logic is now handled on the client-side to ensure
// the onAuthStateChanged listener is correctly triggered.

export async function handleSignOut(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out:", error);
  }
}
