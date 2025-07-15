
// src/ai/flows/report-assistant.ts
'use server';
/**
 * @fileOverview An AI-powered report assistant that improves and refines
 * daily log entries for clarity, professionalism, and completeness.
 *
 * - reportAssistant - A function that refines a given log entry.
 * - ReportAssistantInput - The input type for the reportAssistant function.
 * - ReportAssistantOutput - The return type for the reportAssistant function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ReportAssistantInputSchema = z.object({
  projectDescription: z
    .string()
    .describe('La descrizione del progetto, inclusi scopo e obiettivi.'),
  draftContent: z
    .string()
    .describe('Il testo preliminare della voce di diario scritto dall\'utente.'),
});
export type ReportAssistantInput = z.infer<typeof ReportAssistantInputSchema>;

const ReportAssistantOutputSchema = z.object({
  improvedContent: z
    .string()
    .describe(
      'La versione migliorata e rifinita della voce di diario dell\'utente.'
    ),
});
export type ReportAssistantOutput = z.infer<typeof ReportAssistantOutputSchema>;

export async function reportAssistant(input: ReportAssistantInput): Promise<ReportAssistantOutput> {
  return reportAssistantFlow(input);
}

const prompt = ai.definePrompt({
  name: 'reportAssistantPrompt',
  input: {schema: ReportAssistantInputSchema},
  output: {schema: ReportAssistantOutputSchema},
  prompt: `Sei un assistente AI per direttori dei lavori, specializzato nel migliorare le voci del giornale dei lavori per renderle chiare, professionali e complete.

  Contesto del Progetto: {{{projectDescription}}}
  
  Testo dell'Utente:
  "{{{draftContent}}}"

  Il tuo compito è rivedere e migliorare il testo dell'utente.
  - Correggi eventuali errori di grammatica o di battitura.
  - Migliora la chiarezza, l'oggettività e il tono professionale.
  - Assicurati che il linguaggio sia preciso e tecnico dove appropriato.
  - Espandi la voce solo se sembrano mancare dettagli cruciali basandoti sul contesto del progetto, ma non inventare nuovi fatti.
  - L'output finale deve essere solo il testo migliorato, pronto per essere utilizzato nel giornale dei lavori.

  Restituisci il testo finale e migliorato nel campo 'improvedContent'.`,
});

const reportAssistantFlow = ai.defineFlow(
  {
    name: 'reportAssistantFlow',
    inputSchema: ReportAssistantInputSchema,
    outputSchema: ReportAssistantOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
