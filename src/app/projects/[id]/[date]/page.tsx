
// src/app/projects/[id]/[date]/page.tsx
'use client';

import { DailyLogHeader } from "@/components/log/daily-log-header";
import { AnnotationCard } from "@/components/log/annotation-card";
import { NewAnnotationForm } from "@/components/log/new-annotation-form";
import { ResourcesTable } from "@/components/log/resources-table";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, Save } from "lucide-react";
import { notFound, useParams, useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState, useCallback } from "react";
import type { DailyLog, Project, Annotation, Resource, Stakeholder } from "@/lib/types";
import { getDailyLog, getProject, getDailyLogsForProject, saveDailyLog } from "@/lib/data-service";
import { Skeleton } from "@/components/ui/skeleton";
import { DailyLogNav } from "@/components/log/daily-log-nav";
import { Header } from "@/components/layout/header";
import { useAuth } from "@/hooks/use-auth";

function PageLoader() {
  return (
    <>
      <Header />
      <div className="container mx-auto p-4 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 lg:gap-8">
          <aside className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
              </CardHeader>
             </Card>
            <Card>
              <CardContent className="p-0">
                <Skeleton className="h-72 w-full" />
              </CardContent>
            </Card>
          </aside>
          <main className="lg:col-span-3 space-y-6 mt-8 lg:mt-0">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-48 w-full" />
          </main>
        </div>
      </div>
    </>
  )
}

export default function ProjectLogPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const { id: projectId, date: dateString } = params as { id: string, date: string };

  const [project, setProject] = useState<Project | null>(null);
  const [projectLogs, setProjectLogs] = useState<DailyLog[]>([]);
  const [dailyLog, setDailyLog] = useState<DailyLog | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [fetchedProject, fetchedLog, fetchedLogs] = await Promise.all([
        getProject(projectId),
        getDailyLog(projectId, dateString),
        getDailyLogsForProject(projectId)
      ]);
      
      if (!fetchedProject) {
        notFound();
        return;
      }

      setProject(fetchedProject);
      setProjectLogs(fetchedLogs || []);

      if (fetchedLog) {
        setDailyLog(fetchedLog);
      } else {
        const [year, month, day] = dateString.split('-');
        // Use UTC to avoid timezone issues when creating the date object
        const logDate = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), 12, 0, 0, 0));
        
        setDailyLog({
          id: dateString,
          date: logDate,
          weather: { state: 'Sole', temperature: 20, precipitation: 'Assenti' },
          annotations: [],
          resources: [],
          isValidated: false,
        });
      }
    } catch (error) {
      console.error("Failed to fetch project data:", error);
      toast({ variant: 'destructive', title: "Errore", description: "Impossibile caricare i dati del progetto." });
    } finally {
      setIsLoading(false);
    }
  }, [projectId, dateString, toast]);


  useEffect(() => {
    if (projectId && dateString) {
      fetchData();
    }
  }, [projectId, dateString, fetchData]);
  
  const handleSave = async () => {
    if (!dailyLog || !projectId) return;
    try {
      // The data service now handles the conversion and doesn't need the `project` object
      const { id, ...logToSave } = dailyLog;
      await saveDailyLog(projectId, logToSave);
      toast({
        title: "Dati Salvati",
        description: "Le informazioni della giornata sono state salvate con successo.",
      });
      fetchData(); 
    } catch (error)
    {
      console.error("Failed to save daily log:", error);
      toast({
        variant: 'destructive',
        title: "Errore di Salvataggio",
        description: "Impossibile salvare i dati della giornata.",
      });
    }
  }

  const addAnnotation = useCallback((annotationData: Omit<Annotation, 'id' | 'timestamp' | 'author' | 'isSigned' | 'attachments'>) => {
    if (!user) {
        toast({ variant: 'destructive', title: "Errore", description: "Devi essere loggato per aggiungere una nota." });
        return;
    }
    
    setDailyLog(prevLog => {
      if (!prevLog) return null;

      const currentUserAsStakeholder: Stakeholder = {
        id: user.uid,
        name: user.displayName || 'Utente Anonimo',
        role: 'Direttore dei Lavori (DL)' // You might want to make this dynamic in the future
      };

      const newAnnotation: Annotation = {
        ...annotationData,
        id: `anno-local-${Date.now()}`,
        timestamp: new Date(),
        author: currentUserAsStakeholder, 
        attachments: [],
        isSigned: false, 
      };
      
      const updatedLog = {
        ...prevLog,
        annotations: [...prevLog.annotations, newAnnotation],
      };
      return updatedLog;
    });
  }, [user, toast]);

  const addResource = useCallback((resourceData: Omit<Resource, 'id'>) => {
    setDailyLog(prevLog => {
      if (!prevLog) return null;
      const newResource: Resource = {
        ...resourceData,
        id: `res-local-${Date.now()}`,
      };
      return {
        ...prevLog,
        resources: [...prevLog.resources, newResource],
      };
    });
  }, []);


  if (isLoading || !project || !dailyLog) {
    return <PageLoader />;
  }
  
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="container mx-auto p-4 md:p-8 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-4 lg:gap-8">
          
          <aside className="lg:col-span-1 space-y-6">
             <Card>
              <CardHeader>
                  <CardTitle className="font-headline text-lg text-primary">{project.name}</CardTitle>
                  <CardDescription>{project.client}</CardDescription>
              </CardHeader>
             </Card>
            <DailyLogNav projectLogs={projectLogs} projectId={project.id} activeDate={dailyLog.date} />
          </aside>

          <div className="lg:col-span-3 space-y-6 mt-8 lg:mt-0">
            <DailyLogHeader logDate={dailyLog.date} weather={dailyLog.weather} isDisabled={false} onWeatherChange={(newWeather) => setDailyLog(prev => prev ? {...prev, weather: newWeather} : null)} />

            <div className="space-y-4">
              <h2 className="font-headline text-2xl font-bold">Timeline del Giorno</h2>
              {dailyLog.annotations.map(annotation => (
                <AnnotationCard key={annotation.id} annotation={annotation} isLogValidated={dailyLog.isValidated}/>
              ))}
               {dailyLog.annotations.length === 0 && (
                  <div className="text-center py-12 border-2 border-dashed rounded-lg">
                      <p className="text-muted-foreground">Nessuna annotazione per oggi. Inizia ad aggiungerne una.</p>
                  </div>
               )}
            </div>
            
            <NewAnnotationForm 
              onAddAnnotation={addAnnotation} 
              isDisabled={false}
              projectDescription={project.description}
              />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ResourcesTable resources={dailyLog.resources} onAddResource={addResource} isDisabled={false} />
                <Card>
                  <CardHeader>
                      <CardTitle className="font-headline text-lg">Azioni e Strumenti</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                      <Button onClick={handleSave} className="w-full">
                        <Save className="mr-2 h-4 w-4" /> Salva Dati Giornata
                      </Button>
                      <Button className="w-full" variant="secondary">
                          <FileText className="mr-2 h-4 w-4" /> Emetti SAL
                      </Button>
                  </CardContent>
                  <CardFooter>
                      <Button variant="outline" className="w-full">
                          <Download className="mr-2 h-4 w-4" /> Esporta PDF
                      </Button>
                  </CardFooter>
                </Card>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
