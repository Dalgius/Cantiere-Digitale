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

  const isPublicRoute = publicRoutes.includes(pathname);

  useEffect(() => {
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
    if (loading) {
      return; // Non fare nulla finché lo stato di autenticazione non è definito
    }

    const isNavigating = (!user && !isPublicRoute) || (user && isPublicRoute);

    if (isNavigating) {
      if (!user && !isPublicRoute) {
        router.replace('/login');
      } else if (user && isPublicRoute) {
        router.replace('/');
      }
    }
  }, [user, loading, isPublicRoute, pathname, router]);


  // Mostra il loader se stiamo ancora caricando o se stiamo per reindirizzare
  if (loading || (!user && !isPublicRoute) || (user && isPublicRoute)) {
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
