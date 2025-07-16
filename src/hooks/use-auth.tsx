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
        <div className="flex min-h-screen w-full items-center justify-center">
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
    // This effect handles the Firebase auth state listener
    if (!auth) {
        console.warn("Firebase Auth is not initialized. Skipping auth state listener.");
        setLoading(false);
        return;
    }
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // This effect handles the redirection logic
    if (loading) {
      return; // Don't do anything while loading
    }

    const isPublic = publicRoutes.includes(pathname);

    if (!user && !isPublic) {
      // If not logged in and not on a public route, redirect to login
      router.replace('/login');
    } else if (user && isPublic) {
      // If logged in and on a public route, redirect to dashboard
      router.replace('/');
    }
  }, [user, loading, pathname, router]);

  // Determine if we should show the children or a loader
  const isPublic = publicRoutes.includes(pathname);
  const isRedirecting = (!user && !isPublic) || (user && isPublic);

  if (loading || isRedirecting) {
    return <AuthLoader />;
  }

  const value = { user, loading };

  return (
    <AuthContext.Provider value={value}>
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
