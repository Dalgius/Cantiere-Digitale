
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
import { createPortal } from 'react-dom';
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
    <div 
      ref={ref} 
      style={{ 
        width: '210mm', 
        minHeight: '297mm',
        padding: '40px',
        boxSizing: 'border-box',
        backgroundColor: '#ffffff',
        color: '#000000',
        fontFamily: 'Arial, sans-serif',
        fontSize: '12px',
        lineHeight: '1.4',
        margin: '0',
        position: 'relative',
        display: 'block',
        contain: 'layout style paint',
        isolation: 'isolate'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #1f2937', paddingBottom: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 8px 0' }}>{project.name}</h1>
          <p style={{ fontSize: '14px', margin: '0' }}>Cliente: {project.client}</p>
          <p style={{ fontSize: '14px', margin: '0' }}>Impresa: {project.contractor}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
           <Building2 style={{ width: '40px', height: '40px', margin: '0 auto 8px auto', color: '#374151' }} />
          <h2 style={{ fontSize: '18px', fontWeight: '600', margin: '0' }}>Giornale dei Lavori</h2>
        </div>
      </div>

      <div style={{ margin: '24px 0' }}>
        <div style={{ border: '1px solid #9ca3af', borderRadius: '8px', padding: '16px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 16px 0' }}>
            Dati del Giorno - {format(log.date, "eeee d MMMM yyyy", { locale: it })}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', fontSize: '14px' }}>
            <div><strong>Stato:</strong> {log.weather.state}</div>
            <div><strong>Temperatura:</strong> {log.weather.temperature}°C</div>
            <div style={{ gridColumn: 'span 2' }}><strong>Precipitazioni:</strong> {log.weather.precipitation}</div>
          </div>
        </div>
      </div>

      <div style={{ margin: '24px 0' }}>
        <h3 style={{ fontSize: '20px', fontWeight: 'bold', borderBottom: '1px solid #9ca3af', paddingBottom: '8px', marginBottom: '16px' }}>
          Annotazioni della Giornata
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {log.annotations.map(annotation => (
            <div key={annotation.id} style={{ 
              padding: '12px', 
              border: '1px solid #e5e7eb', 
              borderRadius: '6px',
              pageBreakInside: 'avoid'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div>
                  <p style={{ fontWeight: 'bold', margin: '0', fontSize: '14px' }}>
                    {annotation.author.name} <span style={{ fontWeight: 'normal', color: '#6b7280' }}>({annotation.author.role})</span>
                  </p>
                  <p style={{ fontSize: '12px', color: '#6b7280', margin: '4px 0 0 0' }}>
                    {format(annotation.timestamp, 'd MMMM yyyy, HH:mm', { locale: it })}
                  </p>
                </div>
                <span style={{ 
                  backgroundColor: '#f3f4f6', 
                  color: '#1f2937', 
                  padding: '4px 8px', 
                  borderRadius: '12px', 
                  fontSize: '12px',
                  fontWeight: '500'
                }}>
                  {annotation.type}
                </span>
              </div>
              <p style={{ whiteSpace: 'pre-wrap', margin: '0', fontSize: '14px', paddingTop: '8px' }}>{annotation.content}</p>
            </div>
          ))}
          {log.annotations.length === 0 && (
            <p style={{ color: '#6b7280', margin: '0', padding: '16px', textAlign: 'center' }}>Nessuna annotazione per questa giornata.</p>
          )}
        </div>
      </div>

      <div style={{ margin: '24px 0' }}>
        <h3 style={{ fontSize: '20px', fontWeight: 'bold', borderBottom: '1px solid #9ca3af', paddingBottom: '8px', marginBottom: '16px' }}>
          Risorse Impiegate
        </h3>
        <div style={{ pageBreakInside: 'avoid' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ border: '1px solid #e5e7eb', padding: '8px', textAlign: 'left', backgroundColor: '#f9fafb' }}>Tipo</th>
                <th style={{ border: '1px solid #e5e7eb', padding: '8px', textAlign: 'left', backgroundColor: '#f9fafb' }}>Descrizione</th>
                <th style={{ border: '1px solid #e5e7eb', padding: '8px', textAlign: 'right', backgroundColor: '#f9fafb' }}>Q.tà</th>
                <th style={{ border: '1px solid #e5e7eb', padding: '8px', textAlign: 'right', backgroundColor: '#f9fafb' }}>Ore</th>
              </tr>
            </thead>
            <tbody>
              {log.resources.map(resource => (
                <tr key={resource.id}>
                  <td style={{ border: '1px solid #e5e7eb', padding: '8px' }}>{resource.type}</td>
                  <td style={{ border: '1px solid #e5e7eb', padding: '8px' }}>
                    {resource.description}
                    {resource.company && <div style={{ fontSize: '11px', color: '#6b7280' }}>{resource.company}</div>}
                    {resource.notes && <div style={{ fontSize: '11px', color: '#6b7280', fontStyle: 'italic' }}>{resource.notes}</div>}
                  </td>
                  <td style={{ border: '1px solid #e5e7eb', padding: '8px', textAlign: 'right' }}>{resource.quantity}</td>
                  <td style={{ border: '1px solid #e5e7eb', padding: '8px', textAlign: 'right' }}>{resource.hours || '-'}</td>
                </tr>
              ))}
              {log.resources.length === 0 && (
                 <tr>
                   <td colSpan={4} style={{ border: '1px solid #e5e7eb', padding: '16px', textAlign: 'center', color: '#6b7280' }}>
                      Nessuna risorsa registrata.
                   </td>
                 </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ 
        paddingTop: '40px', 
        marginTop: '40px', 
        borderTop: '1px solid #d1d5db', 
        fontSize: '12px', 
        color: '#6b7280', 
        textAlign: 'center' 
      }}>
        <p style={{ margin: '0' }}>
          Cantiere Digitale - Pagina generata il {format(new Date(), "d MMMM yyyy", { locale: it })}
        </p>
      </div>
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
  
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);
  const [isPreparing, setIsPreparing] = useState(false);

  const [project, setProject] = useState<Project | null>(null);
  const [projectLogs, setProjectLogs] = useState<DailyLog[]>([]);
  const [dailyLog, setDailyLog] = useState<DailyLog | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.left = '-9999px';
    container.style.top = '-9999px';
    container.style.width = '1px';
    container.style.height = '1px';
    container.style.overflow = 'hidden';
    container.style.opacity = '0';
    container.style.pointerEvents = 'none';
    container.style.zIndex = '-9999';
    
    document.body.appendChild(container);
    setPortalContainer(container);

    return () => {
      if (container.parentNode) {
        container.parentNode.removeChild(container);
      }
    };
  }, []);

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
    if (!project || !dailyLog) return;
    
    setIsExporting(true);
    setIsPreparing(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 200));

      const contentToPrint = printRef.current;
      if (!contentToPrint) {
        throw new Error("Impossibile trovare il contenuto da stampare.");
      }

      const canvas = await html2canvas(contentToPrint, {
          scale: 2,
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

      pdf.save(`GiornaleLavori_${project.name}_${dateString}.pdf`);

    } catch (error) {
        console.error("Failed to export PDF:", error);
        toast({
            variant: 'destructive',
            title: "Errore di Esportazione",
            description: (error as Error).message || "Impossibile generare il PDF.",
        });
    } finally {
      setIsExporting(false);
      setIsPreparing(false);
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
      
      {isPreparing && portalContainer && createPortal(
        <PrintableLog ref={printRef} project={project} log={dailyLog} />,
        portalContainer
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

            <ResourcesTable resources={dailyLog.resources} onAddResource={addResource} isDisabled={false} />

             <div className="block lg:hidden pt-4">
                <ActionsCard {...actionHandlers} />
             </div>

          </div>

        </div>
      </main>
    </div>
  );
}
