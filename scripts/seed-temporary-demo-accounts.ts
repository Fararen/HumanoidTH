import "dotenv/config";
import { prisma } from "../lib/prisma";

if (process.env.ALLOW_TEMPORARY_PRODUCTION_DEMO !== "1" || process.env.VERCEL === "1") {
  throw new Error("Set ALLOW_TEMPORARY_PRODUCTION_DEMO=1 and run this seed command locally.");
}

const connectionString = process.env.DATABASE_URL;
const expiresAt = Date.parse(process.env.PUBLIC_DEMO_EXPIRES_AT || "");
if (!connectionString || !Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
  throw new Error("DATABASE_URL and a future PUBLIC_DEMO_EXPIRES_AT are required.");
}
const url = new URL(connectionString);
if (["localhost", "127.0.0.1", "::1"].includes(url.hostname)) {
  throw new Error("This command is for the approved temporary production database, not a local database.");
}

const roles = ["USER", "COMPANY", "ADMIN", "REVIEWER", "LAB", "ORGANIZER", "JUDGE", "MODERATOR"] as const;
try {
  for (const role of roles) {
    const email = `${role.toLowerCase()}@demo.humanoidth.local`;
    await prisma.user.upsert({
      where: { email },
      update: { name: `Hackathon Demo ${role}`, role },
      create: { id: `hackathon-demo-${role.toLowerCase()}`, email, name: `Hackathon Demo ${role}`, role }
    });
  }
  console.log(`Created or refreshed ${roles.length} temporary demo accounts; access expires at ${new Date(expiresAt).toISOString()}.`);
} finally {
  await prisma.$disconnect();
}
