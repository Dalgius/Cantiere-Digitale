
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
    if (!resources || resources.length === 0) return { modifiedAnagrafica: existingRegistered, anagraficaWasModified: false };

    const projectRef = doc(db, 'projects', projectId);
    
    // Use a mutable copy for this operation
    const currentAnagrafica = [...existingRegistered];
    let anagraficaWasModified = false;

    resources.forEach(res => {
        let anagraficaRes = res.registeredResourceId ? currentAnagrafica.find(rr => rr.id === res.registeredResourceId) : undefined;
        
        // Find by content if ID is missing (for new resources added in this session)
        if (!anagraficaRes) {
            anagraficaRes = currentAnagrafica.find(rr => 
                rr.name === res.name && 
                rr.description === res.description && 
                rr.type === res.type && 
                rr.company === res.company
            );
            if (anagraficaRes) {
                res.registeredResourceId = anagraficaRes.id;
            }
        }
        
        if (anagraficaRes) {
            // This resource is in the anagrafica, check if it needs an update.
            const index = currentAnagrafica.findIndex(rr => rr.id === anagraficaRes!.id);
            if (index !== -1) {
                const existingAnagraficaRes = currentAnagrafica[index];
                if (existingAnagraficaRes.description !== res.description ||
                    existingAnagraficaRes.name !== res.name ||
                    existingAnagraficaRes.company !== res.company ||
                    existingAnagraficaRes.type !== res.type)
                {
                    currentAnagrafica[index] = {
                        id: existingAnagraficaRes.id,
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
             res.registeredResourceId = newRegisteredResource.id;
             anagraficaWasModified = true;
        }
    });

    return { modifiedAnagrafica: currentAnagrafica, anagraficaWasModified };
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
    
    const isLogEmpty = (logData.annotations || []).length === 0 && (logData.resources || []).length === 0;

    if (isLogEmpty) {
        try {
            await deleteDoc(logRef);
        } catch(e) {
            // It might not exist, which is fine.
        }
        return;
    }

    const { modifiedAnagrafica, anagraficaWasModified } = await updateRegisteredResources(projectId, logData.resources, existingRegistered);
    
    if (anagraficaWasModified) {
        await updateDoc(doc(db, 'projects', projectId), {
            registeredResources: modifiedAnagrafica
        });
    }

    const logToSave = {
      ...logData,
      date: Timestamp.fromDate(new Date(logData.date)),
      annotations: (logData.annotations || []).map(anno => ({
        ...anno,
        timestamp: anno.timestamp ? Timestamp.fromDate(new Date(anno.timestamp)) : Timestamp.now(),
      })),
      resources: logData.resources,
    };

    await setDoc(logRef, logToSave, { merge: true });
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
