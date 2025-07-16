
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
  const [isRedirecting, setIsRedirecting] = useState(false);

  const router = useRouter();
  const pathname = usePathname();

  // In ascolto dei cambiamenti dello stato utente
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Gestione redirect
  useEffect(() => {
    if (loading) return;

    const isPublic = publicRoutes.includes(pathname);

    if (!user && !isPublic) {
      setIsRedirecting(true);
      router.replace('/login');
    } else if (user && isPublic) {
      setIsRedirecting(true);
      router.replace('/');
    } else {
      setIsRedirecting(false); // Non serve redirect
    }
  }, [user, loading, pathname, router]);

  // Mostra loader se:
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
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
