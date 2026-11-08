import { getSessionUser } from "@/lib/session";
import { verifySubscriptionAdmin } from "./subscription-admin";

/** Signed browser sessions and explicitly configured machine credentials share one policy. */
export async function hasAdminApiAccess(request: Request) {
  const header = request.headers.get("authorization");
  if (header?.startsWith("Basic ")) {
    const decoded = Buffer.from(header.slice(6), "base64").toString("utf8");
    const separator = decoded.indexOf(":");
    if (separator >= 0 && verifySubscriptionAdmin(decoded.slice(0, separator), decoded.slice(separator + 1))) return true;
  }
  return (await getSessionUser())?.role === "ADMIN";
}
