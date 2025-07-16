// src/hooks/use-auth.tsx
'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const publicRoutes = ['/login', '/signup'];

function AuthLoader() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // If Firebase is not initialized, stop loading and let redirection logic handle it.
    if (!auth) {
        console.warn("Firebase Auth is not initialized. User will be treated as logged out.");
        setLoading(false);
        return;
    }
    // This effect handles the Firebase auth state listener
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // This effect handles the redirection logic, it runs only after the initial loading is complete.
    if (loading) {
      return; // Don't do anything while loading
    }

    const isPublic = publicRoutes.includes(pathname);

    if (!user && !isPublic) {
      // If not logged in and trying to access a protected route, redirect to login
      router.replace('/login');
    } else if (user && isPublic) {
      // If logged in and on a public route (login/signup), redirect to dashboard
      router.replace('/');
    }
  }, [user, loading, pathname, router]);

  // Determine if we should show the children or a loader
  const isPublic = publicRoutes.includes(pathname);
  const isRedirecting = (!user && !isPublic) || (user && isPublic);

  // Show a loader during the initial auth check or if a redirect is imminent.
  // This prevents rendering the page content momentarily before redirecting, which is the source of the loop.
  if (loading || isRedirecting) {
    return <AuthLoader />;
  }

  return (
    <AuthContext.Provider value={{ user, loading: false }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
