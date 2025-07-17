
// src/lib/auth-service.ts
'use server';

import { signOut, updateProfile, type User } from 'firebase/auth';
import { auth } from './firebase';

// Sign-in and sign-up logic is now handled on the client-side to ensure
// the onAuthStateChanged listener is correctly triggered.

export async function handleSignOut(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out:", error);
    throw new Error('Logout fallito');
  }
}

export async function updateUserProfile(data: { displayName?: string, photoURL?: string }): Promise<void> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("Nessun utente autenticato trovato.");
  }
  try {
    await updateProfile(user, data);
  } catch (error) {
    console.error("Error updating user profile:", error);
    throw new Error('Aggiornamento del profilo fallito.');
  }
}
