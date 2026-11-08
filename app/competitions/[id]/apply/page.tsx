import { WorkspaceCreate } from "@/components/platform/Workspaces";
import { entryFields } from "@/lib/platform-catalog";
export default async function Page({ params }: { params: Promise<{ id: string }> }) { return <WorkspaceCreate kind="ENTRY" title="สมัครทีม · Team application" parentId={(await params).id} fields={entryFields} />; }
