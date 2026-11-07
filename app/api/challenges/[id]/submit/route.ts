import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { teamName, contactEmail, solutionTitle, description, repoUrl, dockerImage, hardwareSpecs } = body;

    if (!teamName || !contactEmail || !solutionTitle) {
      return NextResponse.json(
        { success: false, error: "Team name, contact email, and solution title are required" },
        { status: 400 }
      );
    }

    const submission = await prisma.challengeSubmission.create({
      data: {
        challengeId: id,
        teamName: teamName.trim(),
        contactEmail: contactEmail.trim(),
        solutionTitle: solutionTitle.trim(),
        description: description?.trim() || null,
        repoUrl: repoUrl?.trim() || null,
        dockerImage: dockerImage?.trim() || null,
        hardwareSpecs: hardwareSpecs?.trim() || null,
        status: "SUBMITTED"
      }
    });

    return NextResponse.json({ success: true, submission });
  } catch (error) {
    console.error("POST /api/challenges/[id]/submit error:", error);
    return NextResponse.json({ success: false, error: "Failed to save submission" }, { status: 500 });
  }
}
