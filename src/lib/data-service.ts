
// src/lib/data-service.ts
'use server';

import { db, Timestamp } from '@/lib/firebase';
import type { DailyLog, Project, RegisteredResource, Resource } from '@/lib/types';
import { collection, doc, getDoc, getDocs, setDoc, addDoc, deleteDoc, query, where, orderBy, limit, updateDoc, arrayUnion } from 'firebase/firestore';
import { stakeholders } from './data';

// Helper function to convert Firestore snapshots to Project objects
function snapshotToProject(doc: any): Project {
    const data = doc.data();
    // Explicitly exclude fields that are not needed for the list view to keep it light.
    const { stakeholders, lastLogDate, registeredResources, ...rest } = data;
    const project: Project = { id: doc.id, ...rest };
    if (lastLogDate instanceof Timestamp) {
        project.lastLogDate = lastLogDate.toDate();
    }
    return project;
}

// Retrieves all projects, can be used for admin purposes or if no user filter is needed.
export async function getProjects(): Promise<Project[]> {
    try {
        const projectsCol = collection(db, 'projects');
        const projectSnapshot = await getDocs(projectsCol);

        if (projectSnapshot.empty) {
            return [];
        }
        
        const projectList = projectSnapshot.docs.map(snapshotToProject);
        return projectList;
    } catch (error) {
        console.error("Error fetching projects:", error);
        throw new Error("Impossibile recuperare i progetti.");
    }
}


export async function getProject(id: string): Promise<Project | null> {
    try {
        const projectRef = doc(db, 'projects', id);
        const projectSnap = await getDoc(projectRef);

        if (!projectSnap.exists()) {
            return null;
        }
        
        const data = projectSnap.data();
        const project: Project = { id: projectSnap.id, ...data } as Project;
         if (data.lastLogDate instanceof Timestamp) {
            project.lastLogDate = data.lastLogDate.toDate();
        }
        return project;
    } catch (error) {
        console.error(`Error fetching project ${id}:`, error);
        return null;
    }
}


export async function getProjectsByOwner(ownerId: string): Promise<Project[]> {
    try {
        const projectsCol = collection(db, 'projects');
        const q = query(projectsCol, where("ownerId", "==", ownerId));
        const projectSnapshot = await getDocs(q);

        if (projectSnapshot.empty) {
            return [];
        }
        
        const projectList = await Promise.all(projectSnapshot.docs.map(async (projectDoc) => {
            const project = snapshotToProject(projectDoc);
            
            // Get the most recent daily log to find the last log date
            const logsCol = collection(db, `projects/${project.id}/dailyLogs`);
            const logsQuery = query(logsCol, orderBy("date", "desc"), limit(1));
            const logSnapshot = await getDocs(logsQuery);
            
            if (!logSnapshot.empty) {
                const lastLog = logSnapshot.docs[0].data();
                if (lastLog.date instanceof Timestamp) {
                   project.lastLogDate = lastLog.date.toDate();
                }
            }
            
            return project;
        }));

        return projectList;
    } catch (error) {
        console.error(`Error fetching projects for owner ${ownerId}:`, error);
        return [];
    }
}


export async function getDailyLogsForProject(projectId: string): Promise<DailyLog[]> {
    try {
        const logsCol = collection(db, `projects/${projectId}/dailyLogs`);
        const logSnapshot = await getDocs(logsCol);

        const logList = logSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                ...data,
                id: doc.id,
                date: data.date instanceof Timestamp ? data.date.toDate() : new Date(data.date),
                annotations: (data.annotations || []).map((anno: any) => ({
                    ...anno,
                    timestamp: anno.timestamp instanceof Timestamp ? anno.timestamp.toDate() : new Date(anno.timestamp),
                })),
            } as DailyLog;
        });
        
        return logList;
    } catch (error) {
        console.error(`Error fetching logs for project ${projectId}:`, error);
        return [];
    }
}


export async function getDailyLog(projectId: string, date: string): Promise<DailyLog | null> {
    try {
        const logId = date;
        const logRef = doc(db, `projects/${projectId}/dailyLogs`, logId);
        const logSnap = await getDoc(logRef);

        if (!logSnap.exists()) {
            return null;
        }

        const data = logSnap.data();
        
        const processedData: DailyLog = {
            id: logSnap.id,
            date: data.date instanceof Timestamp ? data.date.toDate() : new Date(data.date),
            weather: data.weather,
            annotations: (data.annotations || []).map((anno: any) => ({
                ...anno,
                timestamp: anno.timestamp instanceof Timestamp ? anno.timestamp.toDate() : new Date(anno.timestamp),
            })),
            resources: data.resources || [],
            isValidated: data.isValidated || false,
        };
       
        return processedData;
    } catch (error) {
        console.error(`Error fetching log for project ${projectId}, date ${date}:`, error);
        return null;
    }
}

// Funzione per aggiornare l'anagrafica delle risorse
async function updateRegisteredResources(projectId: string, resources: Resource[], existingRegistered: RegisteredResource[]) {
    if (!resources || resources.length === 0) return;

    const projectRef = doc(db, 'projects', projectId);
    
    // Use a mutable copy for this operation
    const currentAnagrafica = [...existingRegistered];
    let anagraficaWasModified = false;

    resources.forEach(res => {
        if (res.registeredResourceId) {
            // This resource is already in the anagrafica, check if it needs an update.
            const index = currentAnagrafica.findIndex(rr => rr.id === res.registeredResourceId);
            if (index !== -1) {
                const anagraficaRes = currentAnagrafica[index];
                // Check if any field is different
                if (anagraficaRes.description !== res.description ||
                    anagraficaRes.name !== res.name ||
                    anagraficaRes.company !== res.company ||
                    anagraficaRes.type !== res.type)
                {
                    // Update the local copy
                    currentAnagrafica[index] = {
                        id: anagraficaRes.id,
                        type: res.type,
                        description: res.description,
                        name: res.name,
                        company: res.company,
                    };
                    anagraficaWasModified = true;
                }
            }
        } else {
             // This is a new resource, not yet in the anagrafica. Add it.
             const newRegisteredResource: RegisteredResource = {
                id: `reg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                type: res.type,
                description: res.description,
                name: res.name,
                company: res.company,
             };
             currentAnagrafica.push(newRegisteredResource);
             // We also need to give the resource in the log its new ID
             res.registeredResourceId = newRegisteredResource.id;
             anagraficaWasModified = true;
        }
    });


    // If the anagrafica has changed, update it in Firestore
    if (anagraficaWasModified) {
         await updateDoc(projectRef, {
            registeredResources: currentAnagrafica
        });
    }
}

export async function updateProject(id: string, data: Partial<Project>): Promise<void> {
    try {
        const projectRef = doc(db, 'projects', id);
        await updateDoc(projectRef, data);
    } catch (error) {
        console.error(`Error updating project ${id}:`, error);
        throw new Error("Impossibile aggiornare il progetto.");
    }
}


export async function saveDailyLog(projectId: string, logData: Omit<DailyLog, 'id'>, existingRegistered: RegisteredResource[]): Promise<void> {
    const logId = new Date(logData.date).toISOString().split('T')[0];
    const logRef = doc(db, `projects/${projectId}/dailyLogs`, logId);
    
    // If the log is empty (no annotations and no resources), delete it.
    const isLogEmpty = (logData.annotations || []).length === 0 && (logData.resources || []).length === 0;

    if (isLogEmpty) {
        try {
            await deleteDoc(logRef);
        } catch(e) {
            // It might not exist, which is fine.
        }
        return;
    }

    // First, sync the anagrafica. This function will mutate logData.resources to add new IDs.
    await updateRegisteredResources(projectId, logData.resources, existingRegistered);
    
    // Create a safe, serializable object for Firestore
    const logToSave = {
      ...logData,
      date: Timestamp.fromDate(new Date(logData.date)),
      annotations: (logData.annotations || []).map(anno => ({
        ...anno,
        timestamp: anno.timestamp ? Timestamp.fromDate(new Date(anno.timestamp)) : Timestamp.now(),
      })),
      resources: logData.resources, // Now contains the updated registeredResourceIds
    };

    await setDoc(logRef, logToSave, { merge: true });

    // Update last log date
    await updateDoc(doc(db, 'projects', projectId), { lastLogDate: logToSave.date });
}


export async function addProject(projectData: Omit<Project, 'id' | 'stakeholders' | 'ownerId' | 'lastLogDate' | 'registeredResources'>, ownerId: string): Promise<Project> {
    const projectsCol = collection(db, 'projects');
    
    const projectToAdd = {
        ...projectData,
        ownerId: ownerId, // Track who owns the project
        stakeholders: Object.values(stakeholders), // Add default stakeholders on creation
        registeredResources: [], // Initialize with an empty array
    };
    
    const docRef = await addDoc(projectsCol, projectToAdd);
    
    return {
        id: docRef.id,
        ...projectToAdd,
    };
}

export async function deleteProject(projectId: string): Promise<void> {
    const projectRef = doc(db, 'projects', projectId);
    // Note: This doesn't delete subcollections. A Cloud Function would be needed for that in production.
    await deleteDoc(projectRef);
}

    