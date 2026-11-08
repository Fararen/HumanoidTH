import { prisma } from "./prisma";
type User = { id: string; role: string } | null;
export async function companyAccess(user: User, model: { companyId: string | null; reviewerId: string | null }) {
  if (!user || user.id.startsWith("demo:")) return { read: false, edit: false, review: false, admin: false };
  if (user.role === "ADMIN") return { read: true, edit: true, review: true, admin: true };
  const review = user.role === "REVIEWER" && model.reviewerId === user.id;
  const membership = model.companyId ? await prisma.companyMembership.findUnique({ where: { userId_companyId: { userId: user.id, companyId: model.companyId } } }) : null;
  return { read: review || Boolean(membership), edit: Boolean(membership && membership.role !== "VIEWER"), review, admin: false };
}
