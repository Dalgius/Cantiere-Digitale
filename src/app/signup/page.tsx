// src/app/signup/page.tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { createUserWithEmailAndPassword, type AuthError } from 'firebase/auth';
import { auth } from '@/lib/firebase';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { SignUpSchema, type TSignUpSchema } from '@/lib/auth-schemas';
import { useAuth } from '@/hooks/use-auth';

export default function SignUpPage() {
  const { toast } = useToast();
  const { user, loading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<TSignUpSchema>({
    resolver: zodResolver(SignUpSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  async function onSubmit(values: TSignUpSchema) {
    setIsSubmitting(true);
    try {
      await createUserWithEmailAndPassword(auth, values.email, values.password);
      toast({
        title: 'Registrazione completata!',
        description: 'Verrai reindirizzato alla dashboard.',
      });
      // Success is handled by the AuthProvider, which will redirect.
    } catch (e) {
      const error = e as AuthError;
      console.error('[SignUpPage] SignUp failed:', error);
      toast({
        variant: 'destructive',
        title: 'Registrazione Fallita',
        description: error.code === 'auth/email-already-in-use' 
            ? 'Questa email è già stata registrata.'
            : 'Si è verificato un errore. Riprova.',
      });
      setIsSubmitting(false);
    }
  }

  // Show a loader while auth state is being checked or if the user is already logged in.
  if (loading || user) {
    return (
     <div className="flex min-h-screen w-full items-center justify-center">
       <Loader2 className="h-8 w-8 animate-spin text-primary" />
     </div>
   );
 }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-4">
        <div className="flex flex-col items-center gap-2">
            <Image 
              src="/logo.png" 
              alt="Cantiere Digitale Logo" 
              width={160} 
              height={42.67}
              priority
            />
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Crea un account</CardTitle>
            <CardDescription>Inserisci i tuoi dati per iniziare a usare Cantiere Digitale.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input id="email" name="email" placeholder="mario.rossi@email.com" {...field} autoComplete="email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input id="password" name="password" type="password" {...field} autoComplete="new-password" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Conferma Password</FormLabel>
                      <FormControl>
                        <Input id="confirmPassword" name="confirmPassword" type="password" {...field} autoComplete="new-password" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Registrati
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
        <p className="text-center text-sm text-muted-foreground">
          Hai già un account?{' '}
          <Button variant="link" asChild className="px-1">
            <Link href="/login">Accedi</Link>
          </Button>
        </p>
      </div>
    </div>
  );
}
