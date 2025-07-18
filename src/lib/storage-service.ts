// src/lib/storage-service.ts
'use server';

import { storage } from '@/lib/firebase';
import { ref, deleteObject } from 'firebase/storage';

/**
 * Deletes a file from Firebase Storage based on its download URL.
 * @param fileUrl The full HTTPS download URL of the file to delete.
 */
export async function deleteFileFromStorage(fileUrl: string): Promise<void> {
  if (!storage) {
    throw new Error("Firebase Storage is not initialized.");
  }
  
  if (!fileUrl.startsWith('https://firebasestorage.googleapis.com')) {
    console.warn(`URL non valido per Firebase Storage, impossibile eliminare: ${fileUrl}`);
    return;
  }

  try {
    // La funzione ref() può accettare l'URL HTTPS completo per creare un riferimento
    const fileRef = ref(storage, fileUrl);
    
    // Ora elimina il file usando questo riferimento
    await deleteObject(fileRef);
    console.log(`File eliminato con successo: ${fileUrl}`);

  } catch (error: any) {
    // Firebase restituisce 'storage/object-not-found' se il file non esiste già.
    // Possiamo ignorare questo errore, dato che l'obiettivo è che il file non ci sia.
    if (error.code === 'storage/object-not-found') {
      console.warn(`File non trovato in Storage (forse già eliminato?): ${fileUrl}`);
    } else {
      console.error(`Errore durante l'eliminazione del file da Storage: ${fileUrl}`, error);
      // Lanciamo di nuovo l'errore per renderlo visibile nei log del client
      throw new Error(`Impossibile eliminare il file: ${error.message}`);
    }
  }
}
