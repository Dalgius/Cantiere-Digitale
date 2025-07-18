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
    console.error("Firebase Storage is not initialized.");
    return;
  }

  try {
    // Create a reference from the download URL
    const fileRef = ref(storage, fileUrl);
    
    // Delete the file
    await deleteObject(fileRef);
    console.log(`File deleted successfully: ${fileUrl}`);

  } catch (error: any) {
    // Firebase returns 'storage/object-not-found' if the file doesn't exist.
    // We can safely ignore this error, as the goal is to ensure the file is gone.
    if (error.code === 'storage/object-not-found') {
      console.warn(`File not found in Storage (already deleted?): ${fileUrl}`);
    } else {
      console.error(`Error deleting file from Storage: ${fileUrl}`, error);
      // We don't re-throw because failing to delete a file shouldn't block the UI update.
      // The orphan will be handled by a cleanup job later.
    }
  }
}
