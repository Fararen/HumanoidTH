import { WorkspaceCreate } from "@/components/platform/Workspaces";
import { draftFields } from "@/lib/platform-catalog";
export default function Page() { return <WorkspaceCreate kind="DRAFT" title="เขียนโพสต์ · Write a post" fields={draftFields} />; }
