// src/app/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProjectCard } from "@/components/dashboard/project-card";
import Link from "next/link";
import { getProjectsByOwner } from "@/lib/data-service";
import type { Project } from '@/lib/types';
import { Header } from '@/components/layout/header';
import { Skeleton } from '@/components/ui/skeleton';

function DashboardSkeleton() {
    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
                <CardSkeleton key={i} />
            ))}
        </div>
    );
}

function CardSkeleton() {
    return (
        <div className="p-4 border rounded-lg space-y-3">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-16 w-full mt-4" />
             <div className="flex justify-between items-center pt-4">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-6 w-24" />
            </div>
        </div>
    );
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Only fetch if auth is done and we have a user
    if (authLoading) {
      return;
    }

    if (user?.uid) {
      const fetchProjects = async () => {
        setIsLoading(true);
        try {
          const userProjects = await getProjectsByOwner(user.uid);
          setProjects(userProjects || []);
        } catch (error) {
          console.error("Failed to fetch projects:", error);
          setProjects([]);
        } finally {
          setIsLoading(false);
        }
      };
      fetchProjects();
    } else {
      // No user, no projects to load
      setIsLoading(false);
      setProjects([]);
    }
  }, [authLoading, user?.uid]); // Depend only on stable user.uid

  if (authLoading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  // If there's no user, the AuthProvider will handle the redirect.
  // Return null to avoid a flash of the dashboard.
  if (!user) {
    return null;
  }

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
          
          {isLoading ? (
             <DashboardSkeleton />
          ) : projects.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
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
      </main>
    </div>
  );
}
