// src/app/projects/[id]/page.tsx
import { getDailyLogsForProject } from "@/lib/data-service";
import { redirect } from "next/navigation";

// This is a Server Component. It must be async to handle params correctly.
export default async function ProjectPageRedirect({ params }: { params: { id?: string } }) {
  // Add a type check for params.id and handle undefined case
  if (!params.id) {
    redirect('/');
    return null;
  }

  const projectId = params.id;

  const projectLogs = await getDailyLogsForProject(projectId);

  // If there are no logs, redirect to a new log for today's date.
  if (!projectLogs || projectLogs.length === 0) {
    const today = new Date().toISOString().split('T')[0];
    redirect(`/projects/${projectId}/${today}`);
    return null;
  }

  // Otherwise, sort the logs by date to find the most recent one and redirect.
  const sortedLogs = projectLogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const latestLog = sortedLogs[0];
  
  const latestDate = new Date(latestLog.date).toISOString().split('T')[0];
  redirect(`/projects/${projectId}/${latestDate}`);
  return null;
}