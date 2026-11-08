"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getSessionUser, setSessionUser } from "@/lib/session";
import { passwordHash } from "@/lib/auth-token";
import { verifySubscriptionAdmin } from "@/lib/subscription-admin";
import type { SourceType } from "../generated/prisma";
import { prisma } from "@/lib/prisma";
import { runAdapter } from "@/lib/ingest/adapters";
import { canonicalizeUrl } from "@/lib/url";

function readTextField(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function readOptionalTextField(formData: FormData, key: string) {
  const value = readTextField(formData, key);
  return value || null;
}

function readOptionalUrlField(formData: FormData, key: string) {
  const value = canonicalizeUrl(readTextField(formData, key));
  return value || null;
}

function readOptionalNumberField(formData: FormData, key: string) {
  const value = readTextField(formData, key);
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function readOptionalDateField(formData: FormData, key: string) {
  const value = readTextField(formData, key);
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

async function requireAdminUser() {
  const user = await getSessionUser();
  if (user?.role !== "ADMIN") throw new Error("Administrator access is required.");
  return user;
}

function revalidateAtlasCms() {
  const paths = [
    "/",
    "/dashboard",
    "/database",
    "/robots",
    "/inventory",
    "/contributions",
    "/perspectives",
    "/analytics",
    "/submit-data",
    "/admin",
    "/admin/submitted-data",
    "/admin/cms"
  ];

  for (const path of paths) {
    revalidatePath(path);
  }
}

export async function createSubmission(formData: FormData) {
  const cookieStore = await cookies();
  const currentEmail = (await getSessionUser())?.email;
  if (!currentEmail) {
    redirect("/profile?from=/submit-data");
  }

  const user = await prisma.user.findUnique({ where: { email: currentEmail } });
  if (!user) {
    redirect("/profile?from=/submit-data");
  }

  const submissionType = readTextField(formData, "submissionType");
  const allowedTypes = ["source_url", "robot_model", "owned_inventory_update", "contribution_claim", "event_demo_record", "correction_request"];
  const title = readTextField(formData, "title");
  const url = readOptionalUrlField(formData, "url");
  if (!allowedTypes.includes(submissionType)) throw new Error("Choose a valid submission type.");
  if (!title) throw new Error("A title is required.");
  if (!url) throw new Error("A public source URL is required so reviewers can verify this record.");

  await prisma.submittedData.create({
    data: {
      submissionType,
      title,
      url,
      notes: readOptionalTextField(formData, "notes"),
      submitterName: user.name || null,
      submitterContact: user.email,
      submittedById: user.id,
      status: "QUEUED"
    }
  });

  revalidateAtlasCms();
  revalidatePath("/profile");
  redirect("/profile");
}

export async function createCompetitionHostRequest(formData: FormData) {
  const cookieStore = await cookies();
  const currentEmail = (await getSessionUser())?.email;
  if (!currentEmail) redirect("/profile?from=/challenges/host");

  const user = await prisma.user.findUnique({ where: { email: currentEmail } });
  if (!user) redirect("/profile?from=/challenges/host");

  const title = readTextField(formData, "title");
  const format = readTextField(formData, "format");
  const category = readTextField(formData, "category");
  const proposedDate = readTextField(formData, "proposedDate");
  const summary = readTextField(formData, "summary");
  const evaluation = readTextField(formData, "evaluation");

  if (!title || !format || !category || !summary || !evaluation) {
    throw new Error("Add a title, format, category, overview, and evaluation criteria.");
  }

  await prisma.submittedData.create({
    data: {
      submissionType: "competition_host_request",
      title,
      notes: [
        `Format: ${format}`,
        `Category: ${category}`,
        proposedDate ? `Proposed start: ${proposedDate}` : null,
        `Overview: ${summary}`,
        `Evaluation: ${evaluation}`
      ].filter(Boolean).join("\n"),
      submitterName: user.name || null,
      submitterContact: user.email,
      submittedById: user.id,
      status: "QUEUED"
    }
  });

  revalidatePath("/challenges");
  revalidatePath("/profile");
  redirect("/profile?competitionRequest=received");
}

export async function updateSubmissionStatus(id: string, formData: FormData) {
  const reviewer = await requireAdminUser();
  const requestedStatus = readTextField(formData, "status");
  const reviewNotes = readOptionalTextField(formData, "reviewNotes");
  if (!["APPROVED", "REJECTED", "NEEDS_REVIEW"].includes(requestedStatus)) throw new Error("Choose a valid review decision.");
  const status = requestedStatus as "APPROVED" | "REJECTED" | "NEEDS_REVIEW";

  const submission = await prisma.submittedData.findUnique({ where: { id } });
  if (!submission) throw new Error("Submission not found.");

  if (status === "APPROVED") {
    if (!submission.url) {
      await prisma.submittedData.update({
        where: { id },
        data: { status: "NEEDS_REVIEW", reviewNotes: reviewNotes || "Add a public source URL before approving this submission." }
      });
      revalidateAtlasCms();
      revalidatePath("/profile");
      return;
    }

    const sourceUrl = submission.url;
    await prisma.$transaction(async (tx) => {
      const existingSource = await tx.sourceRecord.findUnique({ where: { url: sourceUrl }, select: { id: true } });
      if (!existingSource) {
        await tx.sourceRecord.create({
          data: {
            sourceType: "SUBMISSION",
            title: submission.title,
            url: sourceUrl,
            excerpt: submission.notes || "",
            relevanceStatus: "ACCEPTED",
            relevanceReason: "Approved community submission",
            relevanceConfidence: 0.8,
            rawMeta: { submittedDataId: submission.id, submissionType: submission.submissionType, reviewedBy: reviewer.email }
          }
        });
      }

      if (submission.submissionType === "robot_model") {
        await tx.robotModel.upsert({
          where: { canonicalName: submission.title },
          create: {
            canonicalName: submission.title,
            robotType: "humanoid",
            thailandStatus: "observed_in_thailand",
            statusConfidence: 0.8,
            officialUrl: sourceUrl,
            description: submission.notes,
            sourceMeta: { submittedDataId: submission.id, reviewedBy: reviewer.email }
          },
          update: {
            officialUrl: sourceUrl,
            description: submission.notes,
            statusConfidence: 0.8,
            sourceMeta: { submittedDataId: submission.id, reviewedBy: reviewer.email }
          }
        });
      } else if (submission.submissionType === "contribution_claim") {
        await tx.contribution.upsert({
          where: { sourceUrl },
          create: {
            title: submission.title,
            contributionType: "community_submission",
            contributorName: submission.submitterName,
            contributorType: "community",
            description: submission.notes,
            sourceUrl,
            verificationStatus: "APPROVED"
          },
          update: {
            title: submission.title,
            description: submission.notes,
            verificationStatus: "APPROVED"
          }
        });
      }

      await tx.submittedData.update({
        where: { id },
        data: { status: "APPROVED", reviewNotes, submitterContact: submission.submitterContact || reviewer.email }
      });
    });
  } else {
    await prisma.submittedData.update({ where: { id }, data: { status, reviewNotes } });
  }

  revalidateAtlasCms();
  revalidatePath("/profile");
}

export async function runDataPull(formData: FormData) {
  await requireAdminUser();
  const adapter = String(formData.get("adapter") ?? "OPENALEX") as SourceType;
  const query = String(formData.get("query") ?? "").trim();
  const limit = Number(formData.get("limit") ?? 10);

  if (!query) {
    throw new Error("Query is required.");
  }

  const job = await prisma.sourcePullJob.create({
    data: { adapter, query, status: "RUNNING", startedAt: new Date() }
  });

  try {
    const result = await runAdapter(adapter, { query, limit });
    await prisma.sourcePullJob.update({
      where: { id: job.id },
      data: {
        status: result.missingKeys?.length ? "SKIPPED_MISSING_KEY" : "SUCCEEDED",
        recordsFound: result.recordsFound,
        recordsSaved: result.recordsSaved,
        errorMessage: result.missingKeys?.join(", ") || null,
        finishedAt: new Date()
      }
    });
  } catch (error) {
    await prisma.sourcePullJob.update({
      where: { id: job.id },
      data: {
        status: "FAILED",
        errorMessage: error instanceof Error ? error.message : "Unknown ingestion error",
        finishedAt: new Date()
      }
    });
  }

  revalidatePath("/data-pulls");
  revalidatePath("/");
}

export async function loginAsUser(email: string, role: string, companyName?: string) {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Demo account access is disabled in production.");
  }

  const accountRole = role === "ADMIN" ? "ADMIN" : role === "COMPANY" ? "COMPANY" : "USER";
  const cookieStore = await cookies();
  cookieStore.delete("user_session");
  cookieStore.set("user_email", email, { path: "/" });
  cookieStore.set("user_role", accountRole, { path: "/" });
  cookieStore.set("demo_account", accountRole, { path: "/" });
  cookieStore.delete("demo_subscription");
  if (accountRole === "COMPANY" && companyName) {
    cookieStore.set("demo_company_name", companyName, { path: "/" });
  } else {
    cookieStore.delete("demo_company_name");
  }
  if (accountRole === "ADMIN") {
    cookieStore.set("admin_session", "true", { path: "/" });
  } else {
    cookieStore.delete("admin_session");
  }
  revalidatePath("/profile");
  revalidateAtlasCms();
  redirect("/profile");
}

export async function loginAsSubscriber() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Demo subscriptions are disabled in production.");
  }

  const cookieStore = await cookies();
  cookieStore.delete("user_session");
  cookieStore.set("user_email", "subscriber.demo@humanoidth.local", { path: "/" });
  cookieStore.set("user_role", "USER", { path: "/" });
  cookieStore.set("demo_account", "USER", { path: "/" });
  cookieStore.set("demo_subscription", "ACTIVE", { path: "/" });
  cookieStore.delete("demo_company_name");
  cookieStore.delete("admin_session");
  revalidatePath("/profile");
  redirect("/dashboard");
}

export async function registerAndLoginUser(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const name = String(formData.get("name") || "").trim().slice(0, 150);
  const password = String(formData.get("password") || "");
  const companyName = String(formData.get("companyName") || "").trim().slice(0, 150);
  const company = formData.get("accountType") === "COMPANY";
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || password.length < 10 || password.length > 200 || (company && !companyName)) redirect("/sign-in?error=invalid");
  if (await prisma.user.findUnique({ where: { email } })) redirect("/sign-in?error=existing");
  const user = await prisma.$transaction(async tx => {
    const account = await tx.user.create({ data: { email, name, passwordHash: passwordHash(password), role: company ? "COMPANY" : "USER" } });
    if (company) {
      // Registration cannot join another company's organization simply by knowing its name.
      const organization = await tx.company.create({ data: { name: companyName } });
      await tx.companyMembership.create({ data: { userId: account.id, companyId: organization.id, role: "OWNER" } });
    }
    return account;
  }).catch(() => redirect("/sign-in?error=invalid"));
  await setSessionUser(user);
  revalidatePath("/profile");
  redirect("/me");
}

export async function logoutUser() {
  const cookieStore = await cookies();
  cookieStore.delete("user_session");
  cookieStore.delete("user_email");
  cookieStore.delete("user_role");
  cookieStore.delete("admin_session");
  cookieStore.delete("demo_account");
  cookieStore.delete("demo_company_name");
  cookieStore.delete("demo_subscription");
  revalidatePath("/profile");
  revalidateAtlasCms();
  redirect("/profile");
}

export async function adminLoginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (verifySubscriptionAdmin(email, password)) {
    const user = await prisma.user.upsert({
      where: { email },
      update: { role: "ADMIN" },
      create: { email, name: "Admin", role: "ADMIN" }
    });

    await setSessionUser(user);
    
    revalidateAtlasCms();
    redirect("/admin?collection=submitted-data");
  } else {
    redirect("/admin-login?error=invalid_credentials");
  }
}

export async function setLanguage(lang: "en" | "th") {
  const cookieStore = await cookies();
  cookieStore.set("lang", lang, { path: "/" });
  revalidatePath("/", "layout");
}

export async function upsertSourceRecordAction(formData: FormData) {
  await requireAdminUser();
  const id = readTextField(formData, "id");
  const url = readOptionalUrlField(formData, "url");
  const sourceType = readTextField(formData, "sourceType") as any;
  const title = readTextField(formData, "title");

  if (!title) throw new Error("Source title is required.");
  if (!url) throw new Error("Source URL is required.");

  const existing = id
    ? await prisma.sourceRecord.findUnique({ where: { id }, select: { rawMeta: true } })
    : null;

  const payload = {
    sourceType,
    title,
    url,
    excerpt: readOptionalTextField(formData, "excerpt") || "",
    publishedAt: readOptionalDateField(formData, "publishedAt"),
    author: readOptionalTextField(formData, "author"),
    platform: readOptionalTextField(formData, "platform"),
    relevanceStatus: readTextField(formData, "relevanceStatus") as any,
    relevanceReason: readOptionalTextField(formData, "relevanceReason"),
    relevanceConfidence: readOptionalNumberField(formData, "relevanceConfidence") ?? 0
  };

  if (id) {
    await prisma.sourceRecord.update({ where: { id }, data: { ...payload, rawMeta: existing?.rawMeta ?? {} } });
  } else {
    await prisma.sourceRecord.upsert({
      where: { url },
      create: { ...payload, rawMeta: {} },
      update: { ...payload, rawMeta: existing?.rawMeta ?? {} }
    });
  }

  revalidateAtlasCms();
}

export async function upsertRobotModelAction(formData: FormData) {
  await requireAdminUser();
  const id = readTextField(formData, "id");
  const canonicalName = readTextField(formData, "canonicalName");

  if (!canonicalName) throw new Error("Canonical name is required.");

  const existing = id
    ? await prisma.robotModel.findUnique({ where: { id }, select: { sourceMeta: true } })
    : null;

  const payload = {
    canonicalName,
    manufacturer: readOptionalTextField(formData, "manufacturer"),
    developerOrg: readOptionalTextField(formData, "developerOrg"),
    countryOfOrigin: readOptionalTextField(formData, "countryOfOrigin"),
    robotType: readOptionalTextField(formData, "robotType") || "unknown",
    embodimentLevel: readOptionalTextField(formData, "embodimentLevel"),
    primaryUseCase: readOptionalTextField(formData, "primaryUseCase"),
    thailandStatus: readOptionalTextField(formData, "thailandStatus") || "observed_in_thailand",
    statusConfidence: readOptionalNumberField(formData, "statusConfidence") ?? 0.5,
    officialUrl: readOptionalUrlField(formData, "officialUrl"),
    description: readOptionalTextField(formData, "description"),
    firstSeenYear: readOptionalNumberField(formData, "firstSeenYear"),
    lastVerifiedAt: readOptionalDateField(formData, "lastVerifiedAt")
  };

  if (id) {
    await prisma.robotModel.update({ where: { id }, data: { ...payload, sourceMeta: existing?.sourceMeta ?? {} } });
  } else {
    await prisma.robotModel.upsert({
      where: { canonicalName },
      create: { ...payload, sourceMeta: {} },
      update: { ...payload, sourceMeta: existing?.sourceMeta ?? {} }
    });
  }

  revalidateAtlasCms();
}

export async function upsertContributionAction(formData: FormData) {
  await requireAdminUser();
  const id = readTextField(formData, "id");
  const title = readTextField(formData, "title");
  const contributionType = readTextField(formData, "contributionType");
  const sourceUrl = readOptionalUrlField(formData, "sourceUrl");

  if (!title) throw new Error("Contribution title is required.");
  if (!contributionType) throw new Error("Contribution type is required.");

  const payload = {
    contributorName: readOptionalTextField(formData, "contributorName"),
    contributorType: readOptionalTextField(formData, "contributorType"),
    organization: readOptionalTextField(formData, "organization"),
    contributionType,
    title,
    description: readOptionalTextField(formData, "description"),
    relatedRobotModelId: readOptionalTextField(formData, "relatedRobotModelId"),
    sourceUrl,
    license: readOptionalTextField(formData, "license"),
    visibility: readOptionalTextField(formData, "visibility") || "public",
    verificationStatus: readOptionalTextField(formData, "verificationStatus") as any || "NEEDS_REVIEW"
  };

  if (id) {
    await prisma.contribution.update({ where: { id }, data: payload });
  } else if (sourceUrl) {
    await prisma.contribution.upsert({
      where: { sourceUrl },
      create: payload,
      update: payload
    });
  } else {
    await prisma.contribution.create({ data: payload });
  }

  revalidateAtlasCms();
}

export async function upsertSubmittedDataAction(formData: FormData) {
  await requireAdminUser();
  const id = readTextField(formData, "id");
  const title = readTextField(formData, "title");
  const submissionType = readTextField(formData, "submissionType");

  if (!title) throw new Error("Submission title is required.");
  if (!submissionType) throw new Error("Submission type is required.");

  const payload = {
    submissionType,
    title,
    url: readOptionalUrlField(formData, "url"),
    notes: readOptionalTextField(formData, "notes"),
    submitterName: readOptionalTextField(formData, "submitterName"),
    submitterContact: readOptionalTextField(formData, "submitterContact"),
    status: readOptionalTextField(formData, "status") as any || "QUEUED",
    reviewNotes: readOptionalTextField(formData, "reviewNotes")
  };

  if (payload.status === "APPROVED") {
    throw new Error("Use the review decision form to approve and publish a submission.");
  }

  if (id) {
    await prisma.submittedData.update({ where: { id }, data: payload });
  } else {
    await prisma.submittedData.create({ data: { ...payload, payloadJson: {} } });
  }

  revalidateAtlasCms();
}
