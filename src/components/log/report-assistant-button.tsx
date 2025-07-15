
'use client'
import { useState } from 'react'
import { Sparkles, Copy } from 'lucide-react'
import { Button, ButtonProps } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { reportAssistant } from '@/ai/flows/report-assistant'
import { useToast } from '@/hooks/use-toast'
import { Skeleton } from '../ui/skeleton'
import { Card, CardContent } from '../ui/card'

interface ReportAssistantButtonProps extends ButtonProps {
    projectDescription: string;
    draftContent: string;
    onTextImproved: (improvedText: string) => void;
}

export function ReportAssistantButton({ projectDescription, draftContent, onTextImproved, ...props }: ReportAssistantButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [improvedText, setImprovedText] = useState('')
  const { toast } = useToast()

  const handleGetSuggestion = async () => {
    if (!draftContent.trim()) {
        toast({
            variant: "destructive",
            title: "Contenuto vuoto",
            description: "Scrivi prima il testo che vuoi migliorare.",
        });
        return;
    }
    setIsLoading(true)
    setIsOpen(true)
    setImprovedText('')
    try {
      const result = await reportAssistant({
        projectDescription: projectDescription,
        draftContent: draftContent,
      })
      setImprovedText(result.improvedContent)
    } catch (error) {
      console.error(error)
      setIsOpen(false)
      toast({
        variant: "destructive",
        title: "Errore Assistente AI",
        description: "Impossibile migliorare il testo in questo momento.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleUseText = () => {
    onTextImproved(improvedText);
    setIsOpen(false);
    toast({
        title: "Testo Aggiornato",
        description: "La voce di diario è stata aggiornata con la versione dell'assistente.",
    })
  }

  return (
    <>
      <Button onClick={handleGetSuggestion} disabled={isLoading} {...props}>
        <Sparkles className="mr-2 h-4 w-4" />
        {isLoading ? 'Miglioro...' : 'Migliora Testo'}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader>
            <DialogTitle className="font-headline flex items-center gap-2"><Sparkles className="text-accent" /> Testo Migliorato dall'Assistente</DialogTitle>
            <DialogDescription>
              L'assistente ha rivisto il tuo testo per migliorarne chiarezza e professionalità.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-2">La tua versione</h3>
              <Card className="bg-muted/50">
                <CardContent className="p-3 text-sm text-muted-foreground italic">
                  {draftContent}
                </CardContent>
              </Card>
            </div>
             <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-2">Versione Consigliata</h3>
              <Card>
                <CardContent className="p-3 text-sm">
                  {isLoading ? (
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-5/6" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">{improvedText}</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
           <DialogFooter className="sm:justify-between gap-2">
            <Button onClick={() => setIsOpen(false)} variant="ghost">Annulla</Button>
            <Button onClick={handleUseText} disabled={isLoading}>
                <Copy className="mr-2 h-4 w-4" /> Usa questo testo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
