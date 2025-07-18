
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
    // Regex to extract the file path between /o/ and ?alt=media
    const filePathMatch = fileUrl.match(/\/o\/(.*?)\?alt=media/);
    if (!filePathMatch || filePathMatch.length < 2) {
      throw new Error("Impossibile estrarre il percorso del file dall'URL.");
    }
    
    // The path is URL-encoded, so we need to decode it.
    const decodedFilePath = decodeURIComponent(filePathMatch[1]);
    
    // Now create the reference with the decoded file path
    const fileRef = ref(storage, decodedFilePath);
    
    await deleteObject(fileRef);
    console.log(`File eliminato con successo: ${decodedFilePath}`);

  } catch (error: any) {
    if (error.code === 'storage/object-not-found') {
      console.warn(`File non trovato in Storage (forse già eliminato?): ${fileUrl}`);
    } else {
      console.error(`Errore durante l'eliminazione del file da Storage: ${fileUrl}`, error);
      throw new Error(`Impossibile eliminare il file: ${error.message}`);
    }
  }
}
