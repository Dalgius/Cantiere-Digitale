// src/lib/auth-service.ts
'use server';

import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, type AuthError } from 'firebase/auth';
import { auth } from './firebase';
import type { TLoginSchema, TSignUpSchema } from './auth-schemas';

// Helper to create a serializable plain object from the AuthError
function serializeAuthError(error: AuthError) {
  return {
    code: error.code,
    message: error.message,
  };
}

// These functions now return a simple JSON object, which is what Next.js Server Actions expect.
// This prevents the "Maximum call stack size exceeded" error upon form submission.

export async function handleSignUp(values: TSignUpSchema): Promise<{ success: boolean; error?: { code: string; message: string } }> {
  try {
    await createUserWithEmailAndPassword(auth, values.email, values.password);
    return { success: true };
  } catch (e) {
    const error = e as AuthError;
    return { success: false, error: { code: error.code, message: error.message } };
  }
}

export async function handleSignIn(values: TLoginSchema): Promise<{ success: boolean; error?: { code: string; message: string } }> {
  try {
    await signInWithEmailAndPassword(auth, values.email, values.password);
    return { success: true };
  } catch (e) {
    const error = e as AuthError;
    return { success: false, error: { code: error.code, message: error.message } };
  }
}

export async function handleSignOut(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out:", error);
  }
}
