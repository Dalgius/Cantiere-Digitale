// src/app/login/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Building2, Loader2 } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { handleSignIn } from '@/lib/auth-service';
import { LoginSchema, type TLoginSchema } from '@/lib/auth-schemas';
import { useAuth } from '@/hooks/use-auth';

export default function LoginPage() {
  const { toast } = useToast();
  const { user, loading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<TLoginSchema>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(values: TLoginSchema) {
    setIsSubmitting(true);
    const { error } = await handleSignIn(values);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Accesso Fallito',
        description: 'Le credenziali inserite non sono corrette. Riprova.',
      });
      setIsSubmitting(false);
    } else {
      toast({
        title: 'Accesso Effettuato',
        description: 'Bentornato!',
      });
      // The AuthProvider will handle the redirect.
    }
  }

  // Show a loader while auth state is being checked or if the user is already logged in
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
            <Building2 className="h-8 w-8 text-primary" />
            <h1 className="font-headline text-2xl font-bold">Cantiere Digitale</h1>
         </div>
        <Card>
          <CardHeader>
            <CardTitle>Accedi al tuo account</CardTitle>
            <CardDescription>Inserisci le tue credenziali per continuare.</CardDescription>
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
                        <Input placeholder="mario.rossi@email.com" {...field} />
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
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Accedi
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
        <p className="text-center text-sm text-muted-foreground">
          Non hai un account?{' '}
          <Button variant="link" asChild className="px-1">
            <Link href="/signup">Registrati</Link>
          </Button>
        </p>
      </div>
    </div>
  );
}
