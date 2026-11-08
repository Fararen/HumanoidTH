import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

function secret() {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 32) throw new Error("Set SESSION_SECRET to at least 32 random characters");
  return value;
}
export function createSessionToken(email: string, now = Date.now(), lifetimeMs = 8 * 3600_000) {
  const body = Buffer.from(JSON.stringify({ email, expires: now + lifetimeMs })).toString("base64url");
  return `${body}.${createHmac("sha256", secret()).update(body).digest("base64url")}`;
}
export function sessionEmail(token: string | undefined, now = Date.now()): string | null {
  if (!token) return null;
  try {
    const [body, signature, extra] = token.split(".");
    if (extra || !body || !signature) return null;
    const expected = createHmac("sha256", secret()).update(body).digest();
    const provided = Buffer.from(signature, "base64url");
    if (provided.length !== expected.length || !timingSafeEqual(expected, provided)) return null;
    const data = JSON.parse(Buffer.from(body, "base64url").toString());
    return typeof data.email === "string" && data.expires > now ? data.email : null;
  } catch { return null; }
}
export function passwordHash(password: string) {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}
export function verifyPassword(password: string, hash: string | null) {
  if (!hash) return false;
  const [salt, digest] = hash.split(":");
  if (!salt || !digest) return false;
  const computed = scryptSync(password, salt, 64);
  const expected = Buffer.from(digest, "hex");
  return computed.length === expected.length && timingSafeEqual(computed, expected);
}
