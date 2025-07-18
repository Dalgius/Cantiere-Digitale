
// src/app/projects/[id]/[date]/page.tsx
'use client';

import { DailyLogHeader } from "@/components/log/daily-log-header";
import { AnnotationCard } from "@/components/log/annotation-card";
import { NewAnnotationForm } from "@/components/log/new-annotation-form";
import { ResourcesTable } from "@/components/log/resources-table";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, Save, Loader2, Building2 } from "lucide-react";
import { notFound, useParams, useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState, useCallback, useRef, forwardRef } from "react";
import type { DailyLog, Project, Annotation, Resource, Stakeholder } from "@/lib/types";
import { getDailyLog, getProject, getDailyLogsForProject, saveDailyLog } from "@/lib/data-service";
import { Skeleton } from "@/components/ui/skeleton";
import { DailyLogNav } from "@/components/log/daily-log-nav";
import { Header } from "@/components/layout/header";
import { useAuth } from "@/hooks/use-auth";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { createPortal } from "react-dom";

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

function ActionsCard({ onSave, onExport, isSaving, isExporting }: { onSave: () => void, onExport: () => void, isSaving: boolean, isExporting: boolean }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline text-lg">Azioni e Strumenti</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
                <Button onClick={onSave} className="w-full" disabled={isSaving || isExporting}>
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    {isSaving ? 'Salvataggio...' : 'Salva Dati Giornata'}
                </Button>
                <Button variant="outline" className="w-full" onClick={onExport} disabled={isSaving || isExporting}>
                    {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                    {isExporting ? 'Esportazione...' : 'Esporta PDF'}
                </Button>
            </CardContent>
        </Card>
    );
}

// Componente dedicato per il layout di stampa
const PrintableLog = forwardRef<HTMLDivElement, { project: Project, log: DailyLog }>(({ project, log }, ref) => {
  return (
    <div ref={ref} className="p-10 bg-white text-black font-sans" style={{ width: '210mm', minHeight: '297mm' }}>
        <header className="flex justify-between items-center border-b-2 border-gray-800 pb-4">
            <div>
                <h1 className="text-2xl font-bold">{project.name}</h1>
                <p className="text-sm">Cliente: {project.client}</p>
                <p className="text-sm">Impresa: {project.contractor}</p>
            </div>
            <div className="text-right">
                <Building2 className="h-10 w-10 text-gray-700 mx-auto" />
                <h2 className="text-lg font-semibold">Giornale dei Lavori</h2>
            </div>
        </header>

        <section className="my-6">
          <Card className="border-gray-400">
            <CardHeader>
              <CardTitle className="text-base">Dati del Giorno - {format(log.date, "eeee d MMMM yyyy", { locale: it })}</CardTitle>
            </CardHeader>
            <CardContent>
               <div className="grid grid-cols-4 gap-4 text-sm">
                  <div><span className="font-semibold">Stato:</span> {log.weather.state}</div>
                  <div><span className="font-semibold">Temperatura:</span> {log.weather.temperature}°C</div>
                  <div className="col-span-2"><span className="font-semibold">Precipitazioni:</span> {log.weather.precipitation}</div>
               </div>
            </CardContent>
          </Card>
        </section>

        <section className="my-6">
            <h3 className="text-xl font-bold border-b border-gray-400 pb-2 mb-4">Annotazioni della Giornata</h3>
            <div className="space-y-4">
              {log.annotations.map(annotation => (
                <div key={annotation.id} className="p-3 border border-gray-200 rounded-md text-sm break-inside-avoid">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-bold">{annotation.author.name} <span className="font-normal text-gray-600">({annotation.author.role})</span></p>
                      <p className="text-xs text-gray-500">{format(annotation.timestamp, 'd MMMM yyyy, HH:mm', { locale: it })}</p>
                    </div>
                    <Badge variant="secondary" className="text-black">{annotation.type}</Badge>
                  </div>
                  <p className="whitespace-pre-wrap">{annotation.content}</p>
                </div>
              ))}
              {log.annotations.length === 0 && <p className="text-gray-500">Nessuna annotazione per questa giornata.</p>}
            </div>
        </section>
        
        <section className="my-6">
            <h3 className="text-xl font-bold border-b border-gray-400 pb-2 mb-4">Risorse Impiegate</h3>
            <div className="break-inside-avoid">
              <ResourcesTable resources={log.resources} onAddResource={() => {}} isDisabled={true} />
            </div>
        </section>

        <footer className="pt-10 mt-10 border-t border-gray-300 text-xs text-gray-500 text-center">
            <p>Cantiere Digitale - Pagina generata il {format(new Date(), "d MMMM yyyy", { locale: it })}</p>
        </footer>
    </div>
  );
});
PrintableLog.displayName = 'PrintableLog';


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
  const [shouldRenderPrintable, setShouldRenderPrintable] = useState(false);


  const fetchData = useCallback(async (currentProjectId: string, currentDateString: string) => {
    setIsLoading(true);
    try {
      const [fetchedProject, fetchedLog, fetchedLogs] = await Promise.all([
        getProject(currentProjectId),
        getDailyLog(currentProjectId, currentDateString),
        getDailyLogsForProject(currentProjectId)
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
        const [year, month, day] = currentDateString.split('-');
        const logDate = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), 12, 0, 0, 0));
        
        setDailyLog({
          id: currentDateString,
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
  }, [toast]);


  useEffect(() => {
    if (projectId && dateString) {
      fetchData(projectId, dateString);
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
      fetchData(projectId, dateString);
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
    setIsExporting(true);
    setShouldRenderPrintable(true); // Abilita il rendering

    try {
      // Attendi che il componente sia renderizzato nel portale
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const contentToPrint = printRef.current;
      if (!contentToPrint) {
        throw new Error("Elemento per la stampa non trovato.");
      }
      
      const canvas = await html2canvas(contentToPrint, {
          scale: 2, // Aumenta la risoluzione
          useCORS: true,
          logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      const ratio = canvasWidth / pdfWidth;
      const imgHeight = canvasHeight / ratio;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
          position -= pdfHeight;
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
      setShouldRenderPrintable(false); // Rimuovi il componente dopo l'uso
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
  
  const actionHandlers = {
    onSave: handleSave,
    onExport: handleExportToPDF,
    isSaving,
    isExporting,
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      
       {shouldRenderPrintable && typeof window !== 'undefined' && createPortal(
        <div className="absolute -left-[9999px] -top-[9999px]">
          <PrintableLog ref={printRef} project={project} log={dailyLog} />
        </div>,
        document.body
      )}

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
             <div className="hidden lg:block">
                <ActionsCard {...actionHandlers} />
             </div>
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

            <div className="grid grid-cols-1 gap-6 pt-4">
               <ResourcesTable resources={dailyLog.resources} onAddResource={addResource} isDisabled={false} />
            </div>

             <div className="block lg:hidden pt-4">
                <ActionsCard {...actionHandlers} />
             </div>

          </div>

        </div>
      </main>
    </div>
  );
}
