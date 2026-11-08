import { createHash, timingSafeEqual } from "node:crypto";

// Require explicit environment credentials, never the legacy login's default password.
export function verifySubscriptionAdmin(email: string, password: string) {
  const expectedEmail = process.env.ADMIN_BASIC_USER;
  const expectedPassword = process.env.ADMIN_BASIC_PASSWORD;
  if (!expectedEmail || !expectedPassword || email !== expectedEmail || !password) return false;
  const hash = (value: string) => createHash("sha256").update(value).digest();
  return timingSafeEqual(hash(password), hash(expectedPassword));
}
