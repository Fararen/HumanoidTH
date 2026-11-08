import { WorkspaceCreate } from "@/components/platform/Workspaces";
import { evaluationFields } from "@/lib/platform-catalog";
export default function Page() { return <WorkspaceCreate kind="EVALUATION" title="ส่งหุ่นประเมิน · Physical evaluation request" fields={evaluationFields} />; }
