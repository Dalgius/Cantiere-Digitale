// src/lib/auth-service.ts
import { signOut } from 'firebase/auth';
import { auth } from './firebase';

// Sign-in and sign-up logic is handled on the client-side.
// This service only handles server-side authentication actions like signing out.

export async function handleSignOut(): Promise<void> {
  if (!auth) {
    console.error("Firebase Auth service is not available.");
    throw new Error('Servizio di autenticazione non disponibile');
  }
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out:", error);
    throw new Error('Logout fallito');
  }
}
