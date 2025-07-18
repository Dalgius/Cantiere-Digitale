
'use client'

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Paperclip, Send } from "lucide-react"
import { Label } from "@/components/ui/label"
import type { Annotation, AnnotationType } from "@/lib/types"
import React, { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { ReportAssistantButton } from "./report-assistant-button"

interface NewAnnotationFormProps {
    onAddAnnotation: (annotation: Omit<Annotation, 'id' | 'timestamp' | 'author' | 'isSigned' | 'attachments'>) => void;
    isDisabled: boolean;
    projectDescription: string;
}

export function NewAnnotationForm({ onAddAnnotation, isDisabled, projectDescription }: NewAnnotationFormProps) {
  const [type, setType] = useState<AnnotationType | ''>('');
  const [content, setContent] = useState('');
  const { toast } = useToast();

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
    onAddAnnotation({
      type: type as AnnotationType,
      content,
    });
    setType('');
    setContent('');
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
          </CardContent>
          <CardFooter className="flex flex-col-reverse sm:flex-row sm:justify-between sm:items-center gap-2">
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button variant="outline" type="button" asChild disabled={isDisabled} className="w-full sm:w-auto">
                <label htmlFor="file-upload" className="cursor-pointer w-full">
                  <Paperclip className="mr-2 h-4 w-4" />
                  Allega File
                  <input id="file-upload" type="file" multiple className="sr-only" disabled={isDisabled} />
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
