
// src/app/projects/[id]/[date]/page.tsx
'use client';

import { DailyLogHeader } from "@/components/log/daily-log-header";
import { AnnotationCard } from "@/components/log/annotation-card";
import { NewAnnotationForm } from "@/components/log/new-annotation-form";
import { ResourcesTable } from "@/components/log/resources-table";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, Save, Loader2 } from "lucide-react";
import { notFound, useParams, useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState, useCallback, useRef } from "react";
import type { DailyLog, Project, Annotation, Resource, Stakeholder } from "@/lib/types";
import { getDailyLog, getProject, getDailyLogsForProject, saveDailyLog } from "@/lib/data-service";
import { Skeleton } from "@/components/ui/skeleton";
import { DailyLogNav } from "@/components/log/daily-log-nav";
import { Header } from "@/components/layout/header";
import { useAuth } from "@/hooks/use-auth";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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
  const printRef = useRef<HTMLDivElement>(null);

  const [project, setProject] = useState<Project | null>(null);
  const [projectLogs, setProjectLogs] = useState<DailyLog[]>([]);
  const [dailyLog, setDailyLog] = useState<DailyLog | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

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
    setIsSaving(true);
    try {
      const { id, ...logToSave } = dailyLog;
      await saveDailyLog(projectId, logToSave);
      toast({
        title: "Dati Salvati",
        description: "Le informazioni della giornata sono state salvate con successo.",
      });
      fetchData(); 
    } catch (error) {
      console.error("Failed to save daily log:", error);
      toast({
        variant: 'destructive',
        title: "Errore di Salvataggio",
        description: "Impossibile salvare i dati della giornata.",
      });
    } finally {
      setIsSaving(false);
    }
  }

  const handleExportToPDF = async () => {
    if (!printRef.current) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(printRef.current, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      const ratio = canvasWidth / canvasHeight;
      const imgHeight = pdfWidth / ratio;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      pdf.save(`GiornaleLavori_${project?.name}_${dateString}.pdf`);

    } catch (error) {
       console.error("Failed to export PDF:", error);
       toast({
        variant: 'destructive',
        title: "Errore di Esportazione",
        description: "Impossibile generare il PDF.",
      });
    } finally {
      setIsExporting(false);
    }
  };


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
        role: 'Direttore dei Lavori (DL)'
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
             <Card>
              <CardHeader>
                  <CardTitle className="font-headline text-lg">Azioni e Strumenti</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                  <Button onClick={handleSave} className="w-full" disabled={isSaving || isExporting}>
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    {isSaving ? 'Salvataggio...' : 'Salva Dati Giornata'}
                  </Button>
                  <Button variant="outline" className="w-full" onClick={handleExportToPDF} disabled={isSaving || isExporting}>
                      {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                      {isExporting ? 'Esportazione...' : 'Esporta PDF'}
                  </Button>
              </CardContent>
            </Card>
          </aside>

          <div className="lg:col-span-3 space-y-6 mt-8 lg:mt-0">
            <div ref={printRef} className="space-y-6 bg-background rounded-lg p-1">
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
              <div className="grid grid-cols-1 gap-6 pt-4">
                 <ResourcesTable resources={dailyLog.resources} onAddResource={addResource} isDisabled={false} />
              </div>
            </div>
            
            <NewAnnotationForm 
              onAddAnnotation={addAnnotation} 
              isDisabled={false}
              projectDescription={project.description}
            />

          </div>

        </div>
      </main>
    </div>
  );
}
