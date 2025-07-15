// src/lib/auth-schemas.ts
import { z } from 'zod';

export const LoginSchema = z.object({
  email: z.string().email({ message: 'Inserisci un indirizzo email valido.' }),
  password: z.string().min(1, { message: 'La password è richiesta.' }),
});

export type TLoginSchema = z.infer<typeof LoginSchema>;

export const SignUpSchema = z
  .object({
    email: z.string().email({ message: 'Inserisci un indirizzo email valido.' }),
    password: z.string().min(8, { message: 'La password deve contenere almeno 8 caratteri.' }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Le password non coincidono.',
    path: ['confirmPassword'], // a quale campo assegnare l'errore
  });

export type TSignUpSchema = z.infer<typeof SignUpSchema>;
