
'use client';

import { useState, useEffect } from 'react';
import type { Annotation } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { FileUp, Lock, PenSquare, Paperclip, CheckCircle2 } from 'lucide-react';
import Image from 'next/image';

interface AnnotationCardProps {
  annotation: Annotation;
  isLogValidated: boolean;
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

export function AnnotationCard({ annotation, isLogValidated }: AnnotationCardProps) {
  const [isSigned, setIsSigned] = useState(annotation.isSigned);
  const [formattedTimestamp, setFormattedTimestamp] = useState('');

  useEffect(() => {
    // This now runs only on the client, avoiding hydration mismatch.
    setFormattedTimestamp(format(annotation.timestamp, 'd MMMM yyyy, HH:mm', { locale: it }));
  }, [annotation.timestamp]);

  const handleSign = () => {
    // In a real app, this would trigger a server action and digital signature flow.
    setIsSigned(true);
  };
  
  const getAvatarFallback = (name: string) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length > 1) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }


  return (
    <Card className={`transition-all ${isLogValidated ? 'bg-secondary/30' : 'bg-card'}`}>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={undefined} data-ai-hint="person face" />
            <AvatarFallback>{getAvatarFallback(annotation.author.name)}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-base">{annotation.author.name}</CardTitle>
            <CardDescription>{annotation.author.role}</CardDescription>
          </div>
        </div>
        <div className="text-right">
          <Badge variant={getBadgeVariant(annotation.type)}>{annotation.type}</Badge>
          <p className="text-xs text-muted-foreground mt-1">
            {formattedTimestamp}
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-foreground whitespace-pre-wrap">{annotation.content}</p>
        {annotation.attachments.length > 0 && (
          <div className="mt-4">
            <h4 className="text-xs font-semibold text-muted-foreground mb-2">Allegati</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {annotation.attachments.map(att => (
                <div key={att.id} className="group relative">
                  <Image src={att.url} alt={att.caption} width={150} height={100} className="rounded-md object-cover aspect-video" data-ai-hint="construction site" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2">
                    <p className="text-white text-xs text-center">{att.caption}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter>
        
      </CardFooter>
    </Card>
  );
}
