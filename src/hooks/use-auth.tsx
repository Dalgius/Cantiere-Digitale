
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
    // Prevent crash if Firebase isn't configured in the environment
    if (!auth) {
      setLoading(false);
      console.error("Auth service is not available. Firebase may not be configured correctly.");
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (loading) return;

    // If Firebase isn't configured, don't attempt to redirect.
    // The page will likely show an error or empty state, which is appropriate.
    if (!auth) return;

    const isPublic = publicRoutes.includes(pathname);

    // IMPORTANT: Evita redirect loop se sei già sulla pagina giusta
    if (!user && !isPublic && pathname !== '/login') {
      router.replace('/login');
    }
    if (user && isPublic && pathname !== '/') {
      router.replace('/');
    }
  }, [user, loading, pathname, router]);

  // If Firebase isn't configured, show children to reveal any potential underlying errors,
  // but protect routes that require auth.
  if (!auth) {
    const isPublic = publicRoutes.includes(pathname);
    if (!isPublic) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-center">
                <h1 className="text-2xl font-bold text-destructive">Errore di Configurazione</h1>
                <p className="max-w-md text-muted-foreground">
                    Impossibile connettersi a Firebase. Controlla che le variabili d'ambiente siano impostate correttamente nel tuo ambiente di produzione.
                </p>
            </div>
        )
    }
    return <>{children}</>
  }

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
