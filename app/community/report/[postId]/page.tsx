import { getSessionUser } from "@/lib/session";
import { redirect } from "next/navigation";
import { CreateForm } from "@/components/platform/Forms";
export default async function Page({ params }: { params: Promise<{ postId: string }> }) {
  const { postId } = await params;
  if (!await getSessionUser()) redirect(`/guest?from=${encodeURIComponent(`/community/report/${postId}`)}`);
  return <div className="platform-page"><h1>รายงานเนื้อหา · Report content</h1><CreateForm kind="REPORT" title="Content report" defaults={{ postId }} fields={[{ key: "reason", label: "เหตุผล · Reason", type: "textarea", required: true }]} /></div>;
}
