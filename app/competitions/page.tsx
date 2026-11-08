import Link from "next/link";
import { WorkspaceList } from "@/components/platform/Workspaces";
export default function Page() { return <><WorkspaceList kind="COMPETITION" scope="public" title="การแข่งขัน · Competitions" introduction="อ่านกติกา รุ่น รอบ โหมด และกำหนดปิดส่งก่อนสมัครทีม" /><nav className="platform-links"><Link href="/ops/challenges">พื้นที่ผู้จัด · Organizer workspace</Link><Link href="/challenges">แค็ตตาล็อกตัวอย่างเดิม · Example catalog</Link></nav></>; }
