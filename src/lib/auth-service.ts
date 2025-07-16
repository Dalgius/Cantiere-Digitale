// src/lib/auth-service.ts
'use server';

import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, UserCredential, AuthError } from 'firebase/auth';
import { auth } from './firebase'; // Import the initialized auth instance
import type { TLoginSchema, TSignUpSchema } from './auth-schemas';

// This function now correctly returns a structured error object
export async function handleSignUp(values: TSignUpSchema): Promise<{ user?: UserCredential; error?: AuthError }> {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
    return { user: userCredential };
  } catch (error) {
    // Ensure the caught error is always returned in the expected structure
    return { error: error as AuthError };
  }
}

export async function handleSignIn(values: TLoginSchema): Promise<{ user?: UserCredential; error?: AuthError }> {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
    return { user: userCredential };
  } catch (error) {
    return { error: error as AuthError };
  }
}

export async function handleSignOut(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out:", error);
  }
}
