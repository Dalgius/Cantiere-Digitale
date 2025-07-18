
'use client'

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Paperclip, Send, X } from "lucide-react"
import { Label } from "@/components/ui/label"
import type { Annotation, AnnotationType } from "@/lib/types"
import React, { useState } from "react"
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setAttachments(prev => [...prev, ...filesArray]);

      const newPreviews = filesArray.map(file => URL.createObjectURL(file));
      setPreviews(prev => [...prev, ...newPreviews]);
    }
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

  return (
    <form onSubmit={handleSubmit}>
      <fieldset disabled={isDisabled} className="disabled:opacity-70">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline text-lg">Aggiungi Voce di Diario</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="annotation-type">Tipo di Annotazione</Label>
              <Select value={type} onValueChange={(value) => setType(value as AnnotationType)} disabled={isDisabled}>
                <SelectTrigger id="annotation-type">
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
            <div className="space-y-2">
              <Label htmlFor="annotation-content">Contenuto</Label>
              <Textarea
                id="annotation-content"
                placeholder="Descrivi qui l'annotazione..."
                rows={5}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                disabled={isDisabled}
              />
            </div>
             {previews.length > 0 && (
              <div className="space-y-2">
                <Label>Allegati</Label>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
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
          </CardContent>
          <CardFooter className="flex flex-col-reverse sm:flex-row sm:justify-between sm:items-center gap-2">
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button variant="outline" type="button" asChild disabled={isDisabled} className="w-full sm:w-auto">
                <label htmlFor="file-upload" className="cursor-pointer w-full">
                  <Paperclip className="mr-2 h-4 w-4" />
                  Allega File
                  <input 
                    id="file-upload" 
                    type="file" 
                    multiple 
                    className="sr-only" 
                    disabled={isDisabled}
                    onChange={handleFileChange}
                    accept="image/*"
                    capture="environment"
                  />
                </label>
              </Button>
              <ReportAssistantButton 
                projectDescription={projectDescription}
                draftContent={content}
                onTextImproved={handleUseImprovedText}
                variant="outline" 
                className="w-full sm:w-auto" 
              />
            </div>
            <Button type="submit" disabled={isDisabled} className="w-full sm:w-auto">
              <Send className="mr-2 h-4 w-4" />
              Aggiungi
            </Button>
          </CardFooter>
        </Card>
      </fieldset>
    </form>
  )
}
