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
    console.log('[AuthProvider] onAuthStateChanged handler attached');
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('[AuthProvider] Auth state changed:', user ? user.uid : null);
      setUser(user);
      setLoading(false);
    });
    return () => {
      console.log('[AuthProvider] onAuthStateChanged handler detached');
      unsubscribe();
    }
  }, []);

  useEffect(() => {
    console.log('[AuthProvider] [RedirectEffect] Running. loading:', loading, 'user:', !!user, 'pathname:', pathname);
    if (loading) return;
    
    const isPublic = publicRoutes.includes(pathname);

    if (!user && !isPublic) {
      if (pathname !== '/login') {
        console.log(`[AuthProvider] Redirecting to /login from ${pathname}`);
        router.replace('/login');
      } else {
        console.log('[AuthProvider] No redirect needed, already on /login');
      }
    } else if (user && isPublic) {
        if (pathname !== '/') {
            console.log(`[AuthProvider] Redirecting to / from ${pathname}`);
            router.replace('/');
        } else {
            console.log('[AuthProvider] No redirect needed, already on /');
        }
    } else {
      console.log('[AuthProvider] No redirect needed');
    }
  }, [user, loading, pathname, router]);
  
  if (loading) {
    console.log("[AuthProvider] Rendering loader because loading is true.");
    return <AuthLoader />;
  }

  // This logic helps prevent rendering children on the wrong route while redirecting
  const isPublic = publicRoutes.includes(pathname);
  if (!user && !isPublic) {
    console.log("[AuthProvider] Rendering loader because user is not authenticated on a protected route.");
    return <AuthLoader />;
  }
  if (user && isPublic) {
    console.log("[AuthProvider] Rendering loader because user is authenticated on a public route.");
    return <AuthLoader />;
  }
  
  console.log("[AuthProvider] Rendering children.");
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
