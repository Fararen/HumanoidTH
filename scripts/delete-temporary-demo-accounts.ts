import "dotenv/config";
import { prisma } from "../lib/prisma";

if (process.env.ALLOW_TEMPORARY_DEMO_ACCOUNT_DELETE !== "1" || process.env.VERCEL === "1") {
  throw new Error("Set ALLOW_TEMPORARY_DEMO_ACCOUNT_DELETE=1 and run this cleanup command locally.");
}

const roles = ["user", "company", "admin", "reviewer", "lab", "organizer", "judge", "moderator"];
try {
  const result = await prisma.user.deleteMany({
    where: { email: { in: roles.map(role => `${role}@demo.humanoidth.local`) } }
  });
  console.log(`Deleted ${result.count} temporary demo accounts.`);
} finally {
  await prisma.$disconnect();
}
