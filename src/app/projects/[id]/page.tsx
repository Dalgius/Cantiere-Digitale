
// src/app/projects/[id]/page.tsx
import { getDailyLogsForProject } from "@/lib/data-service";
import { redirect } from "next/navigation";

export default async function ProjectPageRedirect({ params }: { params: { id: string } }) {
  const projectLogs = await getDailyLogsForProject(params.id);

  // Se non ci sono log, reindirizza a un nuovo log per la data odierna.
  if (!projectLogs || projectLogs.length === 0) {
    const today = new Date().toISOString().split('T')[0];
    redirect(`/projects/${params.id}/${today}`);
  }

  // Altrimenti, ordina i log per data per trovare il più recente e reindirizza a quello.
  const sortedLogs = projectLogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const latestLog = sortedLogs[0];
  
  const latestDate = new Date(latestLog.date).toISOString().split('T')[0];
  redirect(`/projects/${params.id}/${latestDate}`);
}
