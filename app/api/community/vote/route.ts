import { getSessionUser } from "@/lib/session";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const user = await getSessionUser();
    if (!user || user.id.startsWith("demo:")) return NextResponse.json({ success: false, error: "Sign in required" }, { status: 401 });
    const { postId, voteType } = body;
    const userKey = user.id;

    if (!postId || !["UP", "DOWN", "CANCEL"].includes(voteType)) {
      return NextResponse.json({ success: false, error: "Invalid vote parameters" }, { status: 400 });
    }

    // Resolve post
    const post = await prisma.communityPost.findFirst({
      where: { OR: [{ id: postId }, { slug: postId }] }
    });

    if (!post) {
      return NextResponse.json({ success: false, error: "Post not found" }, { status: 404 });
    }

    // Check existing vote
    const existing = await prisma.communityVote.findUnique({
      where: {
        postId_userKey: {
          postId: post.id,
          userKey
        }
      }
    });

    let upDelta = 0;
    let downDelta = 0;

    if (existing) {
      if (existing.voteType === voteType || voteType === "CANCEL") {
        // Cancel vote
        if (existing.voteType === "UP") upDelta -= 1;
        if (existing.voteType === "DOWN") downDelta -= 1;
        await prisma.communityVote.delete({ where: { id: existing.id } });
      } else {
        // Switch vote
        if (existing.voteType === "UP") {
          upDelta -= 1;
          downDelta += 1;
        } else {
          downDelta -= 1;
          upDelta += 1;
        }
        await prisma.communityVote.update({
          where: { id: existing.id },
          data: { voteType }
        });
      }
    } else if (voteType !== "CANCEL") {
      // New vote
      if (voteType === "UP") upDelta += 1;
      if (voteType === "DOWN") downDelta += 1;
      await prisma.communityVote.create({
        data: {
          postId: post.id,
          userKey,
          voteType
        }
      });
    }

    const updated = await prisma.communityPost.update({
      where: { id: post.id },
      data: {
        upvotes: { increment: upDelta },
        downvotes: { increment: downDelta }
      }
    });

    return NextResponse.json({
      success: true,
      upvotes: Math.max(0, updated.upvotes),
      downvotes: Math.max(0, updated.downvotes),
      userVote: voteType === "CANCEL" || (existing && existing.voteType === voteType) ? null : voteType
    });
  } catch (error) {
    console.error("POST /api/community/vote error:", error);
    return NextResponse.json({ success: false, error: "Failed to record vote" }, { status: 500 });
  }
}
