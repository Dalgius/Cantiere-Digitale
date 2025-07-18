
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
        width: '794px', // Larghezza in pixel per A4 a 96 DPI
        minHeight: 'auto',
        padding: '60px 40px',
        boxSizing: 'border-box',
        backgroundColor: '#ffffff',
        color: '#000000',
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
        lineHeight: '1.6',
        margin: '0',
        position: 'relative',
        display: 'block'
      }}
    >
      {/* Header modificato - scritta centrata in alto */}
      <div style={{ 
        textAlign: 'center',
        borderBottom: '3px solid #1f2937', 
        paddingBottom: '20px',
        marginBottom: '30px'
      }}>
        <h1 style={{ 
          fontSize: '32px', 
          fontWeight: 'bold', 
          margin: '0 0 20px 0', 
          color: '#1f2937',
          textTransform: 'uppercase',
          letterSpacing: '2px'
        }}>
          GIORNALE DEI LAVORI
        </h1>
        <h2 style={{ 
          fontSize: '24px', 
          fontWeight: '600', 
          margin: '0 0 15px 0', 
          color: '#374151'
        }}>
          {project.name}
        </h2>
        <div style={{ 
          fontSize: '16px', 
          color: '#6b7280',
          display: 'flex',
          justifyContent: 'center',
          gap: '30px',
          flexWrap: 'wrap'
        }}>
          <span>Cliente: {project.client}</span>
          <span>Impresa: {project.contractor}</span>
        </div>
      </div>

      {/* Data semplificata - solo la data */}
      <div style={{ marginBottom: '30px' }}>
        <div style={{ 
          border: '2px solid #e5e7eb', 
          borderRadius: '8px', 
          padding: '20px',
          backgroundColor: '#f9fafb',
          textAlign: 'center'
        }}>
          <h3 style={{ 
            fontSize: '20px', 
            fontWeight: 'bold', 
            margin: '0', 
            color: '#1f2937'
          }}>
            {format(log.date, "eeee d MMMM yyyy", { locale: it })}
          </h3>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center',
            gap: '30px',
            fontSize: '16px',
            marginTop: '15px'
          }}>
            <div><strong>Stato:</strong> {log.weather.state}</div>
            <div><strong>Temperatura:</strong> {log.weather.temperature}°C</div>
            <div><strong>Precipitazioni:</strong> {log.weather.precipitation}</div>
          </div>
        </div>
      </div>

      {/* Annotazioni */}
      <div style={{ marginBottom: '30px' }}>
        <h3 style={{ 
          fontSize: '22px', 
          fontWeight: 'bold', 
          borderBottom: '2px solid #9ca3af', 
          paddingBottom: '10px', 
          marginBottom: '20px',
          color: '#1f2937'
        }}>
          Annotazioni della Giornata
        </h3>
        {log.annotations.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {log.annotations.map((annotation, index) => (
              <div key={annotation.id} style={{ 
                padding: '15px', 
                border: '1px solid #d1d5db', 
                borderRadius: '8px',
                backgroundColor: '#ffffff',
                pageBreakInside: 'avoid'
              }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'flex-start', 
                  marginBottom: '10px' 
                }}>
                  <div>
                    <p style={{ 
                      fontWeight: 'bold', 
                      margin: '0', 
                      fontSize: '16px',
                      color: '#1f2937'
                    }}>
                      {annotation.author.name}
                    </p>
                    <p style={{ 
                      fontSize: '14px', 
                      color: '#6b7280', 
                      margin: '2px 0 0 0' 
                    }}>
                      {annotation.author.role} - {format(annotation.timestamp, 'd MMMM yyyy, HH:mm', { locale: it })}
                    </p>
                  </div>
                  <span style={{ 
                    backgroundColor: '#e5e7eb', 
                    color: '#1f2937', 
                    padding: '6px 12px', 
                    borderRadius: '20px', 
                    fontSize: '14px',
                    fontWeight: '500'
                  }}>
                    {annotation.type}
                  </span>
                </div>
                <div style={{ 
                  fontSize: '15px', 
                  lineHeight: '1.6',
                  color: '#374151',
                  whiteSpace: 'pre-wrap'
                }}>
                  {annotation.content}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ 
            color: '#6b7280', 
            fontSize: '16px',
            textAlign: 'center',
            padding: '40px 0',
            fontStyle: 'italic'
          }}>
            Nessuna annotazione registrata per questa giornata.
          </p>
        )}
      </div>

      {/* Risorse - tabella modificata senza colonna Ore, con colonna Note */}
      <div style={{ marginBottom: '30px' }}>
        <h3 style={{ 
          fontSize: '22px', 
          fontWeight: 'bold', 
          borderBottom: '2px solid #9ca3af', 
          paddingBottom: '10px', 
          marginBottom: '20px',
          color: '#1f2937'
        }}>
          Risorse Impiegate
        </h3>
        {log.resources.length > 0 ? (
          <table style={{ 
            width: '100%', 
            borderCollapse: 'collapse',
            fontSize: '14px'
          }}>
            <thead>
              <tr>
                <th style={{ 
                  border: '2px solid #374151', 
                  padding: '12px 8px', 
                  textAlign: 'left', 
                  backgroundColor: '#f3f4f6',
                  fontWeight: 'bold',
                  width: '20%'
                }}>
                  Tipo
                </th>
                <th style={{ 
                  border: '2px solid #374151', 
                  padding: '12px 8px', 
                  textAlign: 'left', 
                  backgroundColor: '#f3f4f6',
                  fontWeight: 'bold',
                  width: '35%'
                }}>
                  Descrizione
                </th>
                <th style={{ 
                  border: '2px solid #374151', 
                  padding: '12px 8px', 
                  textAlign: 'center', 
                  backgroundColor: '#f3f4f6',
                  fontWeight: 'bold',
                  width: '15%'
                }}>
                  Quantità
                </th>
                <th style={{ 
                  border: '2px solid #374151', 
                  padding: '12px 8px', 
                  textAlign: 'left', 
                  backgroundColor: '#f3f4f6',
                  fontWeight: 'bold',
                  width: '30%'
                }}>
                  Note
                </th>
              </tr>
            </thead>
            <tbody>
              {log.resources.map(resource => (
                <tr key={resource.id}>
                  <td style={{ 
                    border: '1px solid #d1d5db', 
                    padding: '10px 8px',
                    verticalAlign: 'top'
                  }}>
                    {resource.type}
                  </td>
                  <td style={{ 
                    border: '1px solid #d1d5db', 
                    padding: '10px 8px',
                    verticalAlign: 'top'
                  }}>
                    <div>{resource.description}</div>
                    {resource.company && (
                      <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                        {resource.company}
                      </div>
                    )}
                  </td>
                  <td style={{ 
                    border: '1px solid #d1d5db', 
                    padding: '10px 8px', 
                    textAlign: 'center',
                    verticalAlign: 'top'
                  }}>
                    {resource.quantity}
                  </td>
                  <td style={{ 
                    border: '1px solid #d1d5db', 
                    padding: '10px 8px',
                    verticalAlign: 'top'
                  }}>
                    {resource.notes || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p style={{ 
            color: '#6b7280', 
            fontSize: '16px',
            textAlign: 'center',
            padding: '40px 0',
            fontStyle: 'italic'
          }}>
            Nessuna risorsa registrata per questa giornata.
          </p>
        )}
      </div>

      {/* Footer */}
      <div style={{ 
        paddingTop: '30px', 
        marginTop: '30px', 
        borderTop: '2px solid #e5e7eb', 
        fontSize: '14px', 
        color: '#6b7280', 
        textAlign: 'center' 
      }}>
        <p style={{ margin: '0', fontWeight: '500' }}>
          Cantiere Digitale - Documento generato il {format(new Date(), "d MMMM yyyy 'alle' HH:mm", { locale: it })}
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
    // Attendi che il componente sia completamente renderizzato
    await new Promise(resolve => setTimeout(resolve, 800));

    const contentToPrint = printRef.current;
    if (!contentToPrint) {
      throw new Error("Impossibile trovare il contenuto da stampare.");
    }

    // Forza un reflow del contenuto
    contentToPrint.style.display = 'none';
    contentToPrint.offsetHeight; // Trigger reflow
    contentToPrint.style.display = 'block';

    const canvas = await html2canvas(contentToPrint, {
      scale: 1.5, // Ridotto per evitare problemi di memoria
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      width: contentToPrint.scrollWidth,
      height: contentToPrint.scrollHeight,
      windowWidth: 1200,
      windowHeight: 1600,
      x: 0,
      y: 0,
      onclone: (clonedDoc) => {
        // Sostituisci tutte le icone SVG con testo
        const svgElements = clonedDoc.querySelectorAll('svg');
        svgElements.forEach(svg => {
          const replacement = clonedDoc.createElement('div');
          replacement.innerHTML = '🏗️';
          replacement.style.fontSize = '24px';
          replacement.style.textAlign = 'center';
          replacement.style.width = '40px';
          replacement.style.height = '40px';
          replacement.style.display = 'flex';
          replacement.style.alignItems = 'center';
          replacement.style.justifyContent = 'center';
          svg.parentNode?.replaceChild(replacement, svg);
        });
      }
    });

    // Verifica che il canvas abbia contenuto
    if (canvas.width === 0 || canvas.height === 0) {
      throw new Error("Il contenuto catturato è vuoto");
    }

    const imgData = canvas.toDataURL('image/png', 0.8);
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const margin = 10; // Margine di 10mm
    const availableWidth = pdfWidth - (margin * 2);
    const availableHeight = pdfHeight - (margin * 2);
    
    // Calcola le dimensioni corrette mantenendo le proporzioni
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const aspectRatio = canvasWidth / canvasHeight;
    
    let imgWidth = availableWidth;
    let imgHeight = availableWidth / aspectRatio;
    
    // Se l'altezza supera la pagina, ridimensiona basandoti sull'altezza
    if (imgHeight > availableHeight) {
      imgHeight = availableHeight;
      imgWidth = availableHeight * aspectRatio;
    }

    // Centra l'immagine
    const xOffset = (pdfWidth - imgWidth) / 2;
    const yOffset = margin;

    // Aggiungi l'immagine una sola volta, centrata
    pdf.addImage(imgData, 'PNG', xOffset, yOffset, imgWidth, imgHeight);

    // Salva il PDF
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
              
            <ResourcesTable resources={dailyLog.resources} onAddResource={addResource} isDisabled={false} />
            
            <NewAnnotationForm 
              onAddAnnotation={addAnnotation} 
              isDisabled={false}
              projectDescription={project.description}
            />

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

             <div className="block lg:hidden pt-4">
                <ActionsCard {...actionHandlers} />
             </div>

          </div>

        </div>
      </main>
    </div>
  );
}

    