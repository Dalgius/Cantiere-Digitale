
// src/app/projects/[id]/[date]/page.tsx
'use client';

import { DailyLogHeader } from "@/components/log/daily-log-header";
import { AnnotationCard } from "@/components/log/annotation-card";
import { NewAnnotationForm } from "@/components/log/new-annotation-form";
import { ResourcesTable } from "@/components/log/resources-table";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Save, Loader2 } from "lucide-react";
import { notFound, useParams, useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState, useCallback, useRef, forwardRef } from "react";
import { createPortal } from 'react-dom';
import type { DailyLog, Project, Annotation, Resource, Stakeholder, Attachment, RegisteredResource } from "@/lib/types";
import { getDailyLog, getProject, getDailyLogsForProject, saveDailyLog, updateProject } from "@/lib/data-service";
import { deleteFileFromStorage } from "@/lib/storage-service";
import { storage } from "@/lib/firebase";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { Skeleton } from "@/components/ui/skeleton";
import { DailyLogNav } from "@/components/log/daily-log-nav";
import { Header } from "@/components/layout/header";
import { useAuth } from "@/hooks/use-auth";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { Separator } from "@/components/ui/separator";
import { RegisteredResourcesCard } from "@/components/log/registered-resources-card";


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
            <CardHeader className="p-3">
               <CardTitle className="font-headline text-lg">Azioni e Strumenti</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 p-3">
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
const PrintableLog = forwardRef<HTMLDivElement, { project: Project, log: DailyLog, user: any }>(({ project, log, user }, ref) => {
  const direttoreLavori = project.stakeholders.find(s => s.role === 'Direttore dei Lavori (DL)');
  const dlName = user?.displayName || (direttoreLavori ? direttoreLavori.name : '');

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
        <div style={{
          marginTop: '20px',
          fontSize: '16px',
          fontWeight: 'bold',
          color: '#374151'
        }}>
          <div>Direttore dei Lavori</div>
          <div>{dlName}</div>
        </div>
      </div>

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

      <div style={{ marginBottom: '30px' }}>
        <h3 style={{
          fontSize: '22px', 
          fontWeight: 'bold', 
          borderBottom: '2px solid #9ca3af', 
          paddingBottom: '10px', 
          marginBottom: '20px',
          color: '#1f2937',
          textAlign: 'center'
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
                  <span style={{ 
                    color: '#374151', 
                    padding: '5px 10px', 
                    fontSize: '12px',
                    fontWeight: '500',
                    border: '1px solid #d1d5db',
                    borderRadius: '9999px',
                  }}>
                    {annotation.type}
                  </span>
                  <p style={{ 
                    fontSize: '14px', 
                    color: '#6b7280', 
                    margin: '2px 0 0 0' 
                  }}>
                    {format(annotation.timestamp, 'd MMMM yyyy, HH:mm', { locale: it })}
                  </p>
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

      <div style={{ marginBottom: '30px' }}>
        <h3 style={{ 
          fontSize: '22px', 
          fontWeight: 'bold', 
          borderBottom: '2px solid #9ca3af', 
          paddingBottom: '10px', 
          marginBottom: '20px',
          color: '#1f2937',
          textAlign: 'center'
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
                  backgroundColor: '#ffffff',
                  fontWeight: 'bold',
                  width: '20%'
                }}>
                  Tipo
                </th>
                <th style={{ 
                  border: '2px solid #374151', 
                  padding: '12px 8px', 
                  textAlign: 'left', 
                  backgroundColor: '#ffffff',
                  fontWeight: 'bold',
                  width: '35%'
                }}>
                  Descrizione
                </th>
                <th style={{ 
                  border: '2px solid #374151', 
                  padding: '12px 8px', 
                  textAlign: 'center', 
                  backgroundColor: '#ffffff',
                  fontWeight: 'bold',
                  width: '15%'
                }}>
                  Quantità
                </th>
                <th style={{ 
                  border: '2px solid #374151', 
                  padding: '12px 8px', 
                  textAlign: 'left', 
                  backgroundColor: '#ffffff',
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

      <div style={{ 
        paddingTop: '30px', 
        marginTop: '30px', 
        borderTop: '2px solid #e5e7eb', 
        fontSize: '14px', 
        color: '#6b7280', 
        textAlign: 'center' 
      }}>
        <p style={{ margin: '0', fontWeight: '500' }}>
          DIGICANT - Documento generato il {format(new Date(), "d MMMM yyyy 'alle' HH:mm", { locale: it })}
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
  
  const handleSave = async (logToSave?: DailyLog) => {
    const currentLog = logToSave || dailyLog;
    if (!currentLog || !projectId) return;
    
    setIsSaving(true);
    try {
      const { id, ...dataToSave } = currentLog;
      await saveDailyLog(projectId, dataToSave);
      toast({
        title: "Dati Salvati",
        description: "Le informazioni della giornata sono state salvate con successo.",
      });
      // Force a refetch of all data to ensure we have the latest registered resources
      await fetchData(projectId, dateString);
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
    await new Promise(resolve => setTimeout(resolve, 500));

    const contentToPrint = printRef.current;
    if (!contentToPrint) {
      throw new Error("Impossibile trovare il contenuto da stampare.");
    }

    const canvas = await html2canvas(contentToPrint, {
      scale: 1.2, // Scala ridotta per un buon compromesso qualità/dimensione
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    // Verifica che il canvas abbia contenuto
    if (canvas.width === 0 || canvas.height === 0) {
      throw new Error("Il contenuto catturato è vuoto.");
    }
    
    // Usa JPEG per una compressione migliore e una dimensione file inferiore
    const imgData = canvas.toDataURL('image/jpeg', 0.8);
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = imgWidth / imgHeight;

    let finalImgWidth = pdfWidth;
    let finalImgHeight = pdfWidth / ratio;
    
    if (finalImgHeight > pdfHeight) {
      finalImgHeight = pdfHeight;
      finalImgWidth = pdfHeight * ratio;
    }

    const xOffset = (pdfWidth - finalImgWidth) / 2;
    const yOffset = (pdfHeight - finalImgHeight) / 2;

    pdf.addImage(imgData, 'JPEG', xOffset, yOffset, finalImgWidth, finalImgHeight);

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

  const compressImage = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1280; // A reasonable width for reports
          
          const scaleFactor = MAX_WIDTH / img.width;
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scaleFactor;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            return reject(new Error('Failed to get canvas context'));
          }
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          
          canvas.toBlob((blob) => {
            if (!blob) {
              return reject(new Error('Canvas to Blob conversion failed'));
            }
            resolve(blob);
          }, 'image/jpeg', 0.85); // Compress to JPEG with 85% quality
        };
        img.onerror = (error) => reject(error);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const addAnnotation = useCallback(async (annotationData: Omit<Annotation, 'id' | 'timestamp' | 'author' | 'isSigned'>) => {
    if (!user || !projectId || !dateString) {
        toast({ variant: 'destructive', title: "Errore", description: "Dati utente o di progetto mancanti." });
        return;
    }
     if (!storage) {
      toast({ variant: 'destructive', title: "Errore", description: "Servizio di storage non disponibile." });
      return;
    }
    
    let newAttachments: Attachment[] = [];

    try {
      const fileList = annotationData.attachments as unknown as File[];
      
      const uploadPromises = Array.from(fileList).map(async (file, index) => {
        const compressedBlob = await compressImage(file);
        const uniqueFileName = `${Date.now()}-${user.uid}-${file.name}`;
        const attachmentRef = storageRef(storage, `projects/${projectId}/${dateString}/${uniqueFileName}`);
        
        await uploadBytes(attachmentRef, compressedBlob);
        const downloadURL = await getDownloadURL(attachmentRef);

        return {
          id: `att-fire-${Date.now()}-${index}`,
          url: downloadURL,
          caption: file.name,
          type: 'image' as 'image',
        };
      });

      // Wait for all uploads to complete
      newAttachments = await Promise.all(uploadPromises);

    } catch (uploadError) {
      console.error("Error during file upload:", uploadError);
      toast({ variant: 'destructive', title: "Errore di Upload", description: "Impossibile caricare gli allegati. Controlla la configurazione di Firebase Storage (CORS e Regole)." });
      return; // Stop execution if upload fails
    }
    
    const currentUserAsStakeholder: Stakeholder = {
      id: user.uid,
      name: user.displayName || 'Utente Anonimo',
      role: 'Direttore dei Lavori (DL)'
    };

    const newAnnotation: Annotation = {
        id: `anno-local-${Date.now()}`,
        timestamp: new Date(),
        author: currentUserAsStakeholder, 
        isSigned: false, 
        type: annotationData.type,
        content: annotationData.content,
        attachments: newAttachments, // Now contains URLs from Firebase Storage
    };

    setDailyLog(currentLog => {
        if (!currentLog) return null;
        return {
            ...currentLog,
            annotations: [newAnnotation, ...currentLog.annotations],
        };
    });

  }, [user, projectId, dateString, toast]);


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

  const removeAnnotation = useCallback(async (annotationId: string) => {
    const annotationToRemove = dailyLog?.annotations.find(a => a.id === annotationId);
    if (!annotationToRemove) return;

    const updatedLog = {
      ...dailyLog!,
      annotations: dailyLog!.annotations.filter(a => a.id !== annotationId),
    };
    setDailyLog(updatedLog);

    // If the log becomes empty, save it immediately (which will delete it)
    if (updatedLog.annotations.length === 0 && updatedLog.resources.length === 0) {
        await handleSave(updatedLog);
    }
    
    // Asynchronously delete attachments from storage
    if (annotationToRemove.attachments && annotationToRemove.attachments.length > 0) {
        toast({ title: "Eliminazione allegati...", description: "Rimozione dei file in background." });
        const deletePromises = annotationToRemove.attachments.map(att => 
            deleteFileFromStorage(att.url)
        );
        try {
            await Promise.all(deletePromises);
            toast({ title: "File Eliminati", description: "Allegati rimossi con successo." });
        } catch (error) {
            console.error("Failed to delete attachments:", error);
        }
    }
  }, [dailyLog, toast, handleSave]);

  const removeResource = useCallback(async (resourceId: string) => {
    if (!dailyLog) return;
    
    const updatedLog = {
        ...dailyLog,
        resources: dailyLog.resources.filter(r => r.id !== resourceId),
    };
    setDailyLog(updatedLog);
    
    // If the log becomes empty, save it immediately (which will delete it)
    if (updatedLog.annotations.length === 0 && updatedLog.resources.length === 0) {
        await handleSave(updatedLog);
    }
  }, [dailyLog, handleSave]);
  
  const handleRegisteredResourcesUpdate = async (updatedResources: RegisteredResource[]) => {
      if (!project) return;
      try {
        await updateProject(project.id, { registeredResources: updatedResources });
        setProject(prev => prev ? { ...prev, registeredResources: updatedResources } : null);
        toast({
            title: "Anagrafica Aggiornata",
            description: "L'elenco delle risorse è stato salvato.",
        });
      } catch (error) {
          console.error("Failed to update registered resources:", error);
          toast({
              variant: "destructive",
              title: "Errore",
              description: "Impossibile aggiornare l'anagrafica.",
          });
      }
  };


  if (isLoading || !project || !dailyLog) {
    return <PageLoader />;
  }
  
  const actionHandlers = {
    onSave: () => handleSave(),
    onExport: handleExportToPDF,
    isSaving,
    isExporting,
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      
      {isPreparing && portalContainer && createPortal(
        <PrintableLog ref={printRef} project={project} log={dailyLog} user={user} />,
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
            <RegisteredResourcesCard 
                projectId={project.id}
                resources={project.registeredResources || []}
                onResourcesUpdated={handleRegisteredResourcesUpdate}
             />
             <div className="hidden lg:block">
                <ActionsCard {...actionHandlers} />
             </div>
          </aside>

          <div className="lg:col-span-3 space-y-6 mt-8 lg:mt-0">
             <DailyLogHeader logDate={dailyLog.date} weather={dailyLog.weather} isDisabled={false} onWeatherChange={(newWeather) => setDailyLog(prev => prev ? {...prev, weather: newWeather} : null)} />
              
              <Card>
                <CardHeader className="bg-primary text-primary-foreground border-b p-3">
                   <CardTitle className="font-headline text-lg">Annotazioni</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="p-4 md:p-6 space-y-4">
                    {dailyLog.annotations.map(annotation => (
                      <AnnotationCard 
                        key={annotation.id} 
                        annotation={annotation} 
                        isLogValidated={dailyLog.isValidated}
                        onDelete={() => removeAnnotation(annotation.id)}
                        />
                    ))}
                    {dailyLog.annotations.length === 0 && (
                        <div className="text-center py-12 border-2 border-dashed rounded-lg">
                            <p className="text-muted-foreground">Nessuna annotazione per oggi. Inizia ad aggiungerne una.</p>
                        </div>
                    )}
                  </div>
                  <Separator />
                  <div className="p-4 md:p-6">
                    <NewAnnotationForm 
                      onAddAnnotation={addAnnotation} 
                      isDisabled={false}
                      projectDescription={project.description}
                    />
                  </div>
                </CardContent>
              </Card>

            <ResourcesTable 
                resources={dailyLog.resources}
                registeredResources={project.registeredResources || []} 
                onAddResource={addResource} 
                onRemoveResource={removeResource}
                isDisabled={false} 
            />

             <div className="block lg:hidden pt-4">
                <ActionsCard {...actionHandlers} />
             </div>

          </div>

        </div>
      </main>
    </div>
  );
}
