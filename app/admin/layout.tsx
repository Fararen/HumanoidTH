import { getSessionUser } from "@/lib/session";
import { redirect } from "next/navigation";
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if ((await getSessionUser())?.role !== "ADMIN") redirect("/sign-in?from=/admin");
  return children;
}
