import { notFound } from "next/navigation";
import { GRID_TASK, programFields } from "@/lib/platform-catalog";
import { WorkspaceCreate, WorkspaceList } from "@/components/platform/Workspaces";
import RecordView from "@/components/platform/RecordView";
export default async function Page({ params, searchParams }: { params: Promise<{ taskId: string }>; searchParams: Promise<{ programId?: string }> }) {
  if ((await params).taskId !== GRID_TASK.id) notFound();
  const query = await searchParams;
  if (query.programId) return <RecordView id={query.programId} />;
  return <><WorkspaceCreate kind="PROGRAM" title="โปรแกรมนำทาง · Navigation workspace" fields={programFields} /><WorkspaceList kind="PROGRAM" title="โปรแกรมที่บันทึก · Saved programs" /></>;
}
