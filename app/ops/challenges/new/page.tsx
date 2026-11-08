import { WorkspaceCreate } from "@/components/platform/Workspaces";
import { competitionFields } from "@/lib/platform-catalog";
export default function Page() { return <WorkspaceCreate kind="COMPETITION" title="สร้างการแข่งขัน · Create competition" fields={competitionFields} />; }
