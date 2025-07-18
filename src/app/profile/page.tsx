
// src/app/profile/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
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
import { Loader2, Pencil } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { auth } from '@/lib/firebase';
import { updateProfile } from 'firebase/auth';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const profileSchema = z.object({
  title: z.string().optional(),
  displayName: z.string().min(1, 'Il nome è obbligatorio'),
  email: z.string().email('Email non valida'),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const { register, handleSubmit, reset, setValue, watch, control, formState: { errors } } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      title: '',
      displayName: '',
      email: '',
    }
  });
  
  const displayName = watch('displayName');

  useEffect(() => {
    if (user) {
      const [title, ...nameParts] = user.displayName?.split(' ') || ['', ''];
      const name = nameParts.join(' ');

      const validTitles = ['Ing.', 'Arch.', 'Geom.'];
      const currentTitle = validTitles.includes(title) ? title : '';
      const currentName = currentTitle ? name : user.displayName || '';

      reset({
        title: currentTitle,
        displayName: currentName,
        email: user.email || '',
      });
      setAvatarPreview(user.photoURL);
    }
  }, [user, reset]);
  
  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      // In a real app, you'd upload this file to a service and get back a URL
      toast({
        title: "Immagine selezionata",
        description: "Salva le modifiche per applicare la nuova foto profilo.",
      });
    }
  };


  const onSubmit: SubmitHandler<ProfileFormValues> = async (data) => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
       toast({
        variant: 'destructive',
        title: 'Errore',
        description: 'Devi essere autenticato per aggiornare il profilo.',
      });
      return;
    }
    setIsSubmitting(true);
    try {
      const fullDisplayName = data.title ? `${data.title} ${data.displayName}` : data.displayName;
      
      await updateProfile(currentUser, { 
          displayName: fullDisplayName,
          // photoURL: In a real app, you would get this URL from your file upload service
      });
      
      toast({
        title: 'Profilo Aggiornato',
        description: 'Le tue informazioni sono state salvate con successo.',
      });

      setValue('displayName', data.displayName);

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
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader className="items-center text-center">
                 <div className="relative">
                    <Avatar className="h-24 w-24 border-2 border-primary/20">
                     <AvatarImage src={avatarPreview || `https://placehold.co/96x96.png`} alt={user.displayName || 'User'} data-ai-hint="person face"/>
                     <AvatarFallback>{user.email?.substring(0, 2).toUpperCase() || 'U'}</AvatarFallback>
                   </Avatar>
                   <Button 
                      type="button"
                      variant="outline"
                      size="icon"
                      className="absolute bottom-0 right-0 rounded-full h-8 w-8 bg-background"
                      onClick={handleAvatarClick}
                    >
                      <Pencil className="h-4 w-4" />
                      <span className="sr-only">Cambia foto profilo</span>
                   </Button>
                   <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileChange} 
                      className="hidden"
                      accept="image/png, image/jpeg"
                    />
                 </div>
                 <div className="pt-2">
                    <CardTitle className="font-headline text-2xl">{displayName || 'Utente'}</CardTitle>
                    <CardDescription>Visualizza e aggiorna le tue informazioni personali.</CardDescription>
                 </div>
              </CardHeader>
              <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-1 space-y-2">
                         <Label htmlFor="title">Qualifica</Label>
                         <Select onValueChange={(value) => setValue('title', value)} defaultValue={watch('title')}>
                           <SelectTrigger id="title">
                             <SelectValue placeholder="Nessuno" />
                           </SelectTrigger>
                           <SelectContent>
                             <SelectItem value="">Nessuno</SelectItem>
                             <SelectItem value="Ing.">Ing.</SelectItem>
                             <SelectItem value="Arch.">Arch.</SelectItem>
                             <SelectItem value="Geom.">Geom.</SelectItem>
                           </SelectContent>
                         </Select>
                      </div>
                      <div className="md:col-span-2 space-y-2">
                        <Label htmlFor="displayName">Nome Visualizzato</Label>
                        <Input 
                          id="displayName" 
                          {...register('displayName')} 
                          placeholder="Il tuo nome" 
                          disabled={isSubmitting} 
                        />
                        {errors.displayName && <p className="text-sm text-destructive">{errors.displayName.message}</p>}
                      </div>
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
              </CardContent>
            </Card>
        </form>
      </main>
    </div>
  );
}
