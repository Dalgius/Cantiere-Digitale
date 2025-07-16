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
    console.log('[AuthProvider] Mounting and setting up auth state listener.');
    if (!auth) {
        console.error("[AuthProvider] Firebase Auth is not initialized. Cannot set up listener.");
        setLoading(false);
        return;
    }
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('[onAuthStateChanged] Auth state changed. User:', user ? user.email : null);
      setUser(user);
      setLoading(false);
    });
    return () => {
      console.log('[AuthProvider] Unmounting and cleaning up auth listener.');
      unsubscribe();
    }
  }, []);

  useEffect(() => {
    if (loading) {
      console.log('[RedirectEffect] Skipping redirect check: loading is true.');
      return; 
    }

    const isPublic = publicRoutes.includes(pathname);
    console.log(`[RedirectEffect] Checking redirect logic. Path: ${pathname}, IsPublic: ${isPublic}, User: ${!!user}`);

    if (!user && !isPublic) {
      console.log(`[RedirectEffect] User not logged in, on protected route. Redirecting to /login.`);
      router.replace('/login');
    } else if (user && isPublic) {
      console.log(`[RedirectEffect] User logged in, on public route. Redirecting to /.`);
      router.replace('/');
    } else {
       console.log(`[RedirectEffect] No redirect needed.`);
    }
  }, [user, loading, pathname, router]);


  const isPublic = publicRoutes.includes(pathname);
  const shouldRedirect = !loading && ((!user && !isPublic) || (user && isPublic));

  if (loading || shouldRedirect) {
    console.log(`[Render] Showing loader. Loading: ${loading}, ShouldRedirect: ${shouldRedirect}`);
    return <AuthLoader />;
  }
  
  console.log(`[Render] Rendering children. Path: ${pathname}`);
  return (
    <AuthContext.Provider value={{ user, loading }}>
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
