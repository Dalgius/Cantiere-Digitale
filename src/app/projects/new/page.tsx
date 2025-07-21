// src/app/projects/new/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { addProject } from '@/lib/data-service';
import type { Project } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

export default function NewProjectPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    client: '',
    contractor: '',
    description: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
        toast({
            variant: 'destructive',
            title: 'Utente non autenticato',
            description: 'Devi essere loggato per creare un progetto.',
        });
        return;
    }

    setIsLoading(true);

    try {
      // Basic validation
      if (!formData.name || !formData.client || !formData.contractor || !formData.description) {
        toast({
            variant: 'destructive',
            title: 'Campi obbligatori',
            description: 'Per favore, compila tutti i campi.',
        });
        setIsLoading(false); // Stop loading on validation error
        return;
      }

      const newProjectData: Omit<Project, 'id' | 'stakeholders' | 'ownerId' | 'lastLogDate'> = {
        name: formData.name,
        client: formData.client,
        contractor: formData.contractor,
        description: formData.description,
      };
      
      const newProject = await addProject(newProjectData, user.uid);
      
      toast({
        title: 'Progetto Creato!',
        description: `Il progetto "${newProject.name}" è stato aggiunto con successo.`,
      });

      // Redirect to the new project's page, which will default to today's log
      router.push(`/projects/${newProject.id}`);
      // No need to call setIsLoading(false) here as we are navigating away

    } catch (error) {
      console.error('Failed to create project:', error);
      toast({
        variant: 'destructive',
        title: 'Errore',
        description: 'Impossibile creare il progetto. Riprova più tardi.',
      });
      setIsLoading(false); // Stop loading on error
    }
  };

  return (
    <div className="container py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Crea un Nuovo Progetto</CardTitle>
          <CardDescription>
            Inserisci i dettagli principali del progetto. Potrai aggiungere altre informazioni in seguito.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Nome Progetto</Label>
              <Input id="name" name="name" value={formData.name} onChange={handleChange} placeholder="Es. Scuola Primaria 'G. Rodari'" disabled={isLoading} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="client">Cliente / Committente</Label>
                <Input id="client" name="client" value={formData.client} onChange={handleChange} placeholder="Es. Comune di Milano" disabled={isLoading}/>
              </div>
              <div className="space-y-2">
                <Label htmlFor="contractor">Impresa Appaltatrice</Label>
                <Input id="contractor" name="contractor" value={formData.contractor} onChange={handleChange} placeholder="Es. La Costruttoria S.r.l." disabled={isLoading}/>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descrizione Breve</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Descrivi brevemente l'oggetto dei lavori..."
                rows={4}
                disabled={isLoading}
              />
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={isLoading || !user}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLoading ? 'Creazione...' : 'Crea Progetto'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
