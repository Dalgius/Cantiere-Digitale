
'use client'

import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Paperclip, Plus, X, Mic, MicOff, Camera } from "lucide-react"
import { Label } from "@/components/ui/label"
import type { Annotation, AnnotationType } from "@/lib/types"
import React, { useState, useEffect, useRef } from "react"
import { useToast } from "@/hooks/use-toast"
import { ReportAssistantButton } from "./report-assistant-button"
import Image from "next/image"

interface NewAnnotationFormProps {
    onAddAnnotation: (data: Omit<Annotation, 'id' | 'timestamp' | 'author' | 'isSigned'>) => void;
    isDisabled: boolean;
    projectDescription: string;
}

export function NewAnnotationForm({ onAddAnnotation, isDisabled, projectDescription }: NewAnnotationFormProps) {
  const [type, setType] = useState<AnnotationType | ''>('');
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const { toast } = useToast();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const transcriptRef = useRef('');

  useEffect(() => {
    // Feature detection: Check if browser supports SpeechRecognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("Speech Recognition not supported by this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'it-IT';

    recognition.onresult = (event) => {
      let currentTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        currentTranscript += event.results[i][0].transcript;
      }
      transcriptRef.current = currentTranscript;
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error", event.error);
       toast({
        variant: "destructive",
        title: "Errore Riconoscimento Vocale",
        description: `Si è verificato un errore: ${event.error}`,
      });
      setIsListening(false);
    };

    recognition.onend = () => {
      // Update the content with the final transcript only when stopping.
      if (transcriptRef.current) {
         setContent(prevContent => prevContent ? `${prevContent.trim()} ${transcriptRef.current.trim()}` : transcriptRef.current.trim());
         transcriptRef.current = ''; // Clear for next use
      }
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [toast]);

  const handleMicClick = () => {
    const recognition = recognitionRef.current;
    if (!recognition) {
        toast({
            variant: "destructive",
            title: "Funzione non supportata",
            description: "Il tuo browser non supporta il riconoscimento vocale.",
        });
        return;
    }

    if (isListening) {
      recognition.stop();
      // onend will handle setting isListening to false and updating content
    } else {
      try {
        recognition.start();
        setIsListening(true);
      } catch (e) {
        console.error("Could not start recognition", e)
        toast({
            variant: "destructive",
            title: "Impossibile avviare la registrazione",
            description: "Assicurati di aver dato i permessi per il microfono.",
        });
      }
    }
  };


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setAttachments(prev => [...prev, ...filesArray]);

      const newPreviews = filesArray.map(file => URL.createObjectURL(file));
      setPreviews(prev => [...prev, ...newPreviews]);
    }
     // Reset the input value to allow selecting the same file again
    if(e.target) e.target.value = '';
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => {
      const newPreviews = prev.filter((_, i) => i !== index);
      // Clean up object URL to prevent memory leaks
      URL.revokeObjectURL(previews[index]);
      return newPreviews;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isDisabled) return;
    if (!type || !content.trim()) {
      toast({
        variant: "destructive",
        title: "Campi obbligatori",
        description: "Per favore, seleziona un tipo e inserisci il contenuto dell'annotazione.",
      });
      return;
    }
    
    // We are passing the File objects directly. The parent component will handle them.
    onAddAnnotation({
      type: type as AnnotationType,
      content,
      attachments: attachments as any, // Pass files to be handled by parent
    });

    // Reset form state
    setType('');
    setContent('');
    setAttachments([]);
    previews.forEach(url => URL.revokeObjectURL(url)); // Clean up all previews
    setPreviews([]);
  }

  const handleUseImprovedText = (text: string) => {
    setContent(text);
  }

  const isSpeechRecognitionSupported = typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  return (
    <form onSubmit={handleSubmit}>
      <fieldset disabled={isDisabled} className="space-y-4 disabled:opacity-70">
        <div>
          <Label htmlFor="annotation-type" className="text-xs text-muted-foreground">Tipo di Annotazione</Label>
          <Select name="annotation-type-select" value={type} onValueChange={(value) => setType(value as AnnotationType)} disabled={isDisabled}>
            <SelectTrigger id="annotation-type" className="mt-1">
              <SelectValue placeholder="Seleziona il tipo..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Descrizione Lavori Svolti">Descrizione Lavori Svolti</SelectItem>
              <SelectItem value="Istruzioni / Ordine di Servizio">Istruzioni / Ordine di Servizio</SelectItem>
              <SelectItem value="Osservazioni e Annotazioni">Osservazioni e Annotazioni</SelectItem>
              <SelectItem value="Verbale di Constatazione">Verbale di Constatazione</SelectItem>
              <SelectItem value="Verbale di Accettazione Materiali">Verbale di Accettazione Materiali</SelectItem>
              <SelectItem value="Contestazione dell'Impresa">Contestazione dell'Impresa</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="annotation-content" className="text-xs text-muted-foreground">Contenuto</Label>
          <Textarea
            id="annotation-content"
            name="annotation-content"
            placeholder="Descrivi qui l'annotazione o usa il microfono per dettare..."
            rows={5}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={isDisabled}
            className="mt-1"
          />
        </div>
        {previews.length > 0 && (
          <div className="space-y-2">
            <Label>Allegati</Label>
            <div id="attachments-preview" className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
              {previews.map((src, index) => (
                <div key={index} className="relative group">
                  <Image
                    src={src}
                    alt={`Anteprima ${index + 1}`}
                    width={100}
                    height={100}
                    className="rounded-md object-cover aspect-square"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeAttachment(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Hidden file inputs */}
        <input 
            id="file-upload" 
            type="file" 
            multiple 
            className="sr-only" 
            disabled={isDisabled}
            onChange={handleFileChange}
            accept="image/*"
            ref={fileInputRef}
        />
        <input 
            id="camera-upload" 
            type="file"
            className="sr-only" 
            disabled={isDisabled}
            onChange={handleFileChange}
            accept="image/*"
            capture="environment"
            ref={cameraInputRef}
        />
        
        <div className="flex flex-col-reverse sm:flex-row sm:justify-between sm:items-center gap-2">
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button variant="outline" type="button" disabled={isDisabled} onClick={() => fileInputRef.current?.click()} className="w-full sm:w-auto">
                <Paperclip className="mr-2 h-4 w-4" />
                Allega File
              </Button>
              <Button variant="outline" type="button" disabled={isDisabled} onClick={() => cameraInputRef.current?.click()} className="w-full sm:w-auto">
                <Camera className="mr-2 h-4 w-4" />
                Scatta Foto
              </Button>
               {isSpeechRecognitionSupported && (
                  <Button 
                    type="button" 
                    variant={isListening ? "destructive" : "outline"} 
                    onClick={handleMicClick}
                    disabled={isDisabled}
                    className="w-full sm:w-auto"
                  >
                    {isListening ? <MicOff className="mr-2 h-4 w-4" /> : <Mic className="mr-2 h-4 w-4" />}
                    {isListening ? 'Interrompi' : 'Dettatura'}
                  </Button>
                )}
                 <ReportAssistantButton 
                    projectDescription={projectDescription}
                    draftContent={content}
                    onTextImproved={handleUseImprovedText}
                    variant="outline" 
                    className="w-full sm:w-auto" 
                />
            </div>
            <Button type="submit" disabled={isDisabled} className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Aggiungi Annotazione
            </Button>
        </div>
      </fieldset>
    </form>
  )
}
