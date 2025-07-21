
// src/app/projects/[id]/page.tsx
import { redirect } from "next/navigation";

// This component always redirects to the daily log for the current date for a given project.
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

  // Always redirect to today's date.
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  
  redirect(`/projects/${projectId}/${todayStr}`);
}
