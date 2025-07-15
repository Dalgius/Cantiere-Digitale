// src/app/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProjectCard } from "@/components/dashboard/project-card";
import Link from "next/link";
import { getProjects } from "@/lib/data-service";
import type { Project } from '@/lib/types';
import { Header } from '@/components/layout/header';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [projects, setProjects] = useState<Project[] | null>(null);

  useEffect(() => {
    // Solo se l'autenticazione è terminata e l'utente esiste
    if (!authLoading && user) {
      const fetchProjects = async () => {
        try {
          const userProjects = await getProjects();
          setProjects(userProjects || []); // Ensure array fallback
        } catch (error) {
          console.error("Failed to fetch projects:", error);
          setProjects([]); // Fallback to empty array on error
        }
      };
      fetchProjects();
    }
  }, [authLoading, user?.uid]); // Dipendenza stabile

  // Mostra il loader principale finché l'autenticazione non è stata verificata
  if (authLoading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Se l'utente non è loggato, AuthProvider gestirà il reindirizzamento
  // Mostra null per evitare rendering flash di contenuti protetti
  if (!user) {
    return null;
  }

  // L'utente è loggato, mostra la dashboard
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="container py-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-headline font-bold">I tuoi Progetti</h1>
            <Button asChild>
              <Link href="/projects/new">
                <Plus className="mr-2 h-4 w-4" /> Nuovo Progetto
              </Link>
            </Button>
          </div>
          
          {/* Se i progetti sono null, significa che il caricamento è in corso */}
          {projects === null ? (
             <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Skeleton className="h-56 w-full" />
                <Skeleton className="h-56 w-full" />
                <Skeleton className="h-56 w-full" />
             </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {projects.length > 0 ? (
                projects.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))
              ) : (
                <div className="md:col-span-2 lg:col-span-3 text-center py-24 border-2 border-dashed rounded-lg flex flex-col items-center justify-center">
                  <h3 className="text-xl font-medium font-headline">Nessun progetto trovato</h3>
                  <p className="text-muted-foreground mt-2 mb-4 max-w-sm">
                    Inizia creando un nuovo progetto per gestire il tuo cantiere digitale.
                  </p>
                  <Button asChild>
                    <Link href="/projects/new">
                      <Plus className="mr-2 h-4 w-4" /> Crea Progetto
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
