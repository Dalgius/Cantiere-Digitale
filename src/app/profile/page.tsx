
// src/app/profile/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/hooks/use-auth';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { updateUserProfile } from '@/lib/auth-service';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const profileSchema = z.object({
  displayName: z.string().min(1, 'Il nome è obbligatorio'),
  email: z.string().email('Email non valida'),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
  });

  useEffect(() => {
    if (user) {
      reset({
        displayName: user.displayName || '',
        email: user.email || '',
      });
    }
  }, [user, reset]);

  const onSubmit: SubmitHandler<ProfileFormValues> = async (data) => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      await updateUserProfile({ displayName: data.displayName });
      toast({
        title: 'Profilo Aggiornato',
        description: 'Le tue informazioni sono state salvate con successo.',
      });
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast({
        variant: 'destructive',
        title: 'Errore',
        description: 'Impossibile aggiornare il profilo. Riprova più tardi.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="container py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
               <Avatar className="h-16 w-16">
                 <AvatarImage src={`https://placehold.co/64x64.png`} alt={user.displayName || 'User'} data-ai-hint="person face"/>
                 <AvatarFallback>{user.email?.substring(0, 2).toUpperCase() || 'U'}</AvatarFallback>
               </Avatar>
               <div>
                  <CardTitle className="font-headline text-2xl">Il tuo Profilo</CardTitle>
                  <CardDescription>Visualizza e aggiorna le tue informazioni personali.</CardDescription>
               </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="displayName">Nome Visualizzato</Label>
                <Input 
                  id="displayName" 
                  {...register('displayName')} 
                  placeholder="Il tuo nome" 
                  disabled={isSubmitting} 
                />
                {errors.displayName && <p className="text-sm text-destructive">{errors.displayName.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  {...register('email')} 
                  disabled 
                  className="cursor-not-allowed bg-muted/50"
                />
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Salva Modifiche
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
