import { getSessionUser } from "@/lib/session";
import { redirect } from "next/navigation";
import { CreateForm } from "@/components/platform/Forms";
export default async function Page({ params }: { params: Promise<{ postId: string }> }) {
  if (!await getSessionUser()) redirect("/sign-in");
  return <div className="platform-page"><h1>รายงานเนื้อหา · Report content</h1><CreateForm kind="REPORT" title="Content report" defaults={{ postId: (await params).postId }} fields={[{ key: "reason", label: "เหตุผล · Reason", type: "textarea", required: true }]} /></div>;
}
