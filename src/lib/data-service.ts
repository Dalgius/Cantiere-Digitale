// src/lib/data-service.ts
'use server';

import { db, Timestamp } from '@/lib/firebase';
import type { DailyLog, Project } from '@/lib/types';
import { collection, doc, getDoc, getDocs, setDoc, addDoc, deleteDoc, query, where, orderBy, limit } from 'firebase/firestore';
import { stakeholders } from './data';

// Helper function to convert Firestore snapshots to Project objects
function snapshotToProject(doc: any): Project {
    const data = doc.data();
    // Explicitly exclude stakeholders to keep the dashboard payload light for list view
    const { stakeholders, lastLogDate, ...rest } = data;
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

export async function saveDailyLog(projectId: string, logData: Omit<DailyLog, 'id'>): Promise<void> {
    const logId = new Date(logData.date).toISOString().split('T')[0];
    const logRef = doc(db, `projects/${projectId}/dailyLogs`, logId);
    
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

    // Also update the lastLogDate on the project document
    const projectRef = doc(db, 'projects', projectId);
    await setDoc(projectRef, { lastLogDate: logToSave.date }, { merge: true });
}


export async function addProject(projectData: Omit<Project, 'id' | 'stakeholders' | 'ownerId' | 'lastLogDate'>, ownerId: string): Promise<Project> {
    const projectsCol = collection(db, 'projects');
    
    const projectToAdd = {
        ...projectData,
        ownerId: ownerId, // Track who owns the project
        stakeholders: Object.values(stakeholders) // Add default stakeholders on creation
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
