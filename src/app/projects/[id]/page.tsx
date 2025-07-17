// src/app/projects/[id]/page.tsx
import { getDailyLogsForProject } from "@/lib/data-service";
import { redirect } from "next/navigation";

export default async function ProjectPageRedirect({ 
  params 
}: { 
  params: { id: string } 
}) {
  const projectId = params.id;

  if (!projectId) {
    redirect('/');
  }

  const projectLogs = await getDailyLogsForProject(projectId);

  // Handle case with no logs
  if (!projectLogs || projectLogs.length === 0) {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    redirect(`/projects/${projectId}/${todayStr}`);
  }

  // Find most recent valid date efficiently
  let latestDate: Date | null = null;
  
  for (const log of projectLogs) {
    try {
      const logDate = new Date(log.date);
      // Ensure logDate is a valid date before comparison
      if (!isNaN(logDate.getTime())) {
        if (!latestDate || logDate > latestDate) {
          latestDate = logDate;
        }
      }
    } catch {
      // Skip invalid dates
      continue;
    }
  }

  // Fallback to today if no valid dates found
  const targetDate = latestDate || new Date();
  const dateStr = targetDate.toISOString().split('T')[0];
  
  redirect(`/projects/${projectId}/${dateStr}`);
}
