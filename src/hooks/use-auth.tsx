
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
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (loading) return;
    
    const isPublic = publicRoutes.includes(pathname);

    if (!user && !isPublic) {
      // Se l'utente non è loggato e la rotta non è pubblica, reindirizza a login
      router.replace('/login');
    } else if (user && isPublic) {
      // Se l'utente è loggato e si trova su una rotta pubblica, reindirizza alla dashboard
      router.replace('/');
    }
  }, [user, loading, pathname, router]);
  
  // Mostra il loader se l'autenticazione è in corso
  // o se stiamo per essere reindirizzati.
  const isPublic = publicRoutes.includes(pathname);
  if (loading || (!user && !isPublic) || (user && isPublic)) {
    return <AuthLoader />;
  }
  
  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
