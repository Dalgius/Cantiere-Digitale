
// src/lib/data-service.ts
'use server';

import { db, Timestamp } from '@/lib/firebase';
import type { DailyLog, Project, RegisteredResource } from '@/lib/types';
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
async function updateRegisteredResources(projectId: string, logData: Omit<DailyLog, 'id'>) {
    if (!logData.resources || logData.resources.length === 0) return;

    const projectRef = doc(db, 'projects', projectId);
    const projectSnap = await getDoc(projectRef);

    if (!projectSnap.exists()) {
        console.error(`Project ${projectId} not found for updating resources.`);
        return;
    }

    const projectData = projectSnap.data() as Project;
    const existingResources = projectData.registeredResources || [];
    
    // Crea un set di identificatori unici per le risorse esistenti per un controllo rapido
    const existingResourceIds = new Set(existingResources.map(r => `${r.type}-${r.description}-${r.company || ''}`.toLowerCase()));

    // Trova le nuove risorse da aggiungere
    const newResourcesToAdd: RegisteredResource[] = [];
    logData.resources.forEach(res => {
        const resourceId = `${res.type}-${res.description}-${res.company || ''}`.toLowerCase();
        if (!existingResourceIds.has(resourceId)) {
            newResourcesToAdd.push({
                id: `reg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                type: res.type,
                description: res.description,
                company: res.company,
            });
            // Aggiungi al set per evitare di aggiungere duplicati dalla stessa richiesta di log
            existingResourceIds.add(resourceId);
        }
    });

    // Se ci sono nuove risorse, aggiorna il documento del progetto
    if (newResourcesToAdd.length > 0) {
        await updateDoc(projectRef, {
            registeredResources: arrayUnion(...newResourcesToAdd)
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


export async function saveDailyLog(projectId: string, logData: Omit<DailyLog, 'id'>): Promise<void> {
    const logId = new Date(logData.date).toISOString().split('T')[0];
    const logRef = doc(db, `projects/${projectId}/dailyLogs`, logId);
    
    // If the log is empty (no annotations and no resources), delete it.
    const isLogEmpty = (logData.annotations || []).length === 0 && (logData.resources || []).length === 0;

    if (isLogEmpty) {
        await deleteDoc(logRef);
        return;
    }
    
    // Create a safe, serializable object for Firestore
    const logToSave = {
      ...logData,
      date: Timestamp.fromDate(new Date(logData.date)),
      annotations: (logData.annotations || []).map(anno => ({
        ...anno,
        timestamp: anno.timestamp ? Timestamp.fromDate(new Date(anno.timestamp)) : Timestamp.now(),
      })),
    };

    await setDoc(logRef, logToSave, { merge: true });

    // Update registered resources and last log date in parallel
    await Promise.all([
        updateDoc(doc(db, 'projects', projectId), { lastLogDate: logToSave.date }),
        updateRegisteredResources(projectId, logData)
    ]);
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
