
'use client';

import { useState, useEffect } from 'react';
import type { Annotation } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { Trash2 } from 'lucide-react';
import Image from 'next/image';

interface AnnotationCardProps {
  annotation: Annotation;
  isLogValidated: boolean;
  onDelete: (annotationId: string) => void;
}

const getBadgeVariant = (type: Annotation['type']) => {
  switch (type) {
    case 'Contestazione dell\'Impresa':
      return 'destructive';
    case 'Istruzioni / Ordine di Servizio':
      return 'default';
    default:
      return 'outline';
  }
};

export function AnnotationCard({ annotation, isLogValidated, onDelete }: AnnotationCardProps) {
  const [formattedTimestamp, setFormattedTimestamp] = useState('');

  useEffect(() => {
    // This now runs only on the client, avoiding hydration mismatch.
    setFormattedTimestamp(format(new Date(annotation.timestamp), 'd MMMM yyyy, HH:mm', { locale: it }));
  }, [annotation.timestamp]);

  return (
    <Card className={`transition-all ${isLogValidated ? 'bg-secondary/30' : 'bg-card'}`}>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <Badge variant={getBadgeVariant(annotation.type)}>{annotation.type}</Badge>
        <div className="flex items-center gap-2">
           <p className="text-xs text-muted-foreground">{formattedTimestamp}</p>
           <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => onDelete(annotation.id)} disabled={isLogValidated}>
             <Trash2 className="h-4 w-4" />
           </Button>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-foreground whitespace-pre-wrap">{annotation.content}</p>
        {annotation.attachments && annotation.attachments.length > 0 && (
          <div className="mt-4">
            <h4 className="text-xs font-semibold text-muted-foreground mb-2">Allegati</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {annotation.attachments.map(att => (
                <a key={att.id} href={att.url} target="_blank" rel="noopener noreferrer" className="group relative">
                  <Image src={att.url} alt={att.caption} width={150} height={100} className="rounded-md object-cover aspect-video" data-ai-hint="construction site" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2">
                    <p className="text-white text-xs text-center">{att.caption}</p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
