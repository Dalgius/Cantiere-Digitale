
// src/app/projects/[id]/page.tsx
import { getDailyLogsForProject } from "@/lib/data-service";
import { redirect } from "next/navigation";

// Simplify the component to directly accept params
export default async function ProjectPageRedirect({ 
  params 
}: { 
  params: { id: string } 
}) {
  const projectId = params.id;

  // Add a robust check for projectId
  if (!projectId) {
    console.warn("ProjectPageRedirect: Project ID is missing, redirecting to home.");
    redirect('/');
    return; // Ensure no further code execution
  }

  const projectLogs = await getDailyLogsForProject(projectId);

  // Handle case with no logs by redirecting to today's date for a new log entry.
  if (!projectLogs || projectLogs.length === 0) {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    redirect(`/projects/${projectId}/${todayStr}`);
    return; // Ensure no further code execution
  }

  // Find the most recent valid date efficiently
  let latestDate: Date | null = null;
  
  for (const log of projectLogs) {
    // Ensure log.date is valid before processing
    if (log && log.date && !isNaN(new Date(log.date).getTime())) {
      const logDate = new Date(log.date);
      if (!latestDate || logDate > latestDate) {
        latestDate = logDate;
      }
    }
  }

  // Fallback to today if no valid dates were found in the logs
  const targetDate = latestDate || new Date();
  const dateStr = targetDate.toISOString().split('T')[0];
  
  redirect(`/projects/${projectId}/${dateStr}`);
}
