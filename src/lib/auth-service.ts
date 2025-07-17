
// src/lib/auth-service.ts
'use server';

import { signOut } from 'firebase/auth';
import { auth } from './firebase';

// Sign-in and sign-up logic is handled on the client-side.
// This service only handles server-side authentication actions like signing out.

export async function handleSignOut(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out:", error);
    throw new Error('Logout fallito');
  }
}
