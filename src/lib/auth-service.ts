// src/lib/auth-service.ts
'use server';

import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, UserCredential, AuthError } from 'firebase/auth';
import { app } from './firebase';
import type { LoginSchema, SignUpSchema } from './auth-schemas';

const auth = getAuth(app);

export async function handleSignUp(values: SignUpSchema): Promise<{ user?: UserCredential; error?: AuthError }> {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
    return { user: userCredential };
  } catch (error) {
    return { error: error as AuthError };
  }
}

export async function handleSignIn(values: LoginSchema): Promise<{ user?: UserCredential; error?: AuthError }> {
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
