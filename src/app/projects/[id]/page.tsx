import { getDailyLogsForProject } from "@/lib/data-service";
import { notFound, redirect } from "next/navigation";

export default async function ProjectPageRedirect({ params }: { params: { id: string } }) {
  const projectLogs = await getDailyLogsForProject(params.id);

  // If projectLogs is null (should not happen with current data-service, but good practice)
  // or if it's an empty array, we can redirect to a new log for today.
  if (!projectLogs || projectLogs.length === 0) {
    const today = new Date().toISOString().split('T')[0];
    redirect(`/projects/${params.id}/${today}`);
    return; // Stop execution
  }

  // Sort logs by date descending to find the latest one
  const sortedLogs = projectLogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const latestLog = sortedLogs[0];
  
  // This check is now redundant given the one above, but serves as a fallback.
  if (!latestLog) {
    const today = new Date().toISOString().split('T')[0];
    redirect(`/projects/${params.id}/${today}`);
  } else {
    const latestDate = new Date(latestLog.date).toISOString().split('T')[0];
    redirect(`/projects/${params.id}/${latestDate}`);
  }
}
