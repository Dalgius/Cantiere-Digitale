// src/components/dashboard/project-card.tsx
'use client';

import Link from "next/link";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Project } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Bell, ChevronRight, AlertTriangle, Trash2, Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { deleteProject } from "@/lib/data-service";
import { useToast } from "@/hooks/use-toast";

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);

  // Mock notification logic
  const notificationType = project.id === 'proj-1' ? 'warning' : 'info';
  
  // The redirect logic is now handled by /projects/[id]/page.tsx
  const href = `/projects/${project.id}`;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteProject(project.id);
      toast({
        title: "Progetto Eliminato",
        description: `Il progetto "${project.name}" è stato eliminato con successo.`,
      });
      setIsAlertOpen(false); // Chiudi il dialogo
      router.refresh(); // Aggiorna la lista dei progetti
    } catch (error) {
      console.error("Failed to delete project:", error);
      toast({
        variant: "destructive",
        title: "Errore",
        description: "Impossibile eliminare il progetto.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card className="h-full flex flex-col hover:border-primary transition-colors duration-300 group bg-card">
        <div className="flex flex-col flex-grow">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div className="flex-1">
                 <Link href={href}>
                    <CardTitle className="font-headline text-xl group-hover:text-primary transition-colors">{project.name}</CardTitle>
                 </Link>
                 <CardDescription>{project.client} / {project.contractor}</CardDescription>
              </div>
              <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
                <AlertDialogTrigger asChild>
                   <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive shrink-0">
                     <Trash2 className="h-4 w-4" />
                   </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Sei assolutamente sicuro?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Questa azione non può essere annullata. Questo eliminerà permanentemente il progetto
                      <span className="font-bold"> "{project.name}" </span>
                      e tutti i suoi dati associati dal server.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setIsAlertOpen(false)} disabled={isDeleting}>Annulla</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
                      {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {isDeleting ? 'Eliminazione...' : 'Sì, elimina progetto'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardHeader>
          <Link href={href} className="flex flex-col flex-grow">
            <CardContent className="flex-grow">
              <p className="text-sm text-muted-foreground line-clamp-3">{project.description}</p>
            </CardContent>
            <CardFooter className="flex justify-between items-center pt-4">
              {notificationType === 'warning' && (
                <Badge variant="destructive" className="text-xs">
                  <AlertTriangle className="mr-1 h-3 w-3" />
                  Contestazione
                </Badge>
              )}
              {notificationType === 'info' && (
                <Badge variant="secondary" className="text-xs">
                  <Bell className="mr-1 h-3 w-3" />
                  3 giorni senza logs
                </Badge>
              )}
              <div className="flex items-center text-sm text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                <span>Vai al progetto</span>
                <ChevronRight className="h-4 w-4 ml-1" />
              </div>
            </CardFooter>
          </Link>
        </div>
    </Card>
  );
}