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
    const { content, parentId, authorName } = body;

    if (!content || !content.trim()) {
      return NextResponse.json({ success: false, error: "Content is required" }, { status: 400 });
    }

    // Resolve post ID (might be slug or id)
    const post = await prisma.communityPost.findFirst({
      where: {
        OR: [{ id }, { slug: id }]
      },
      select: { id: true }
    });

    if (!post) {
      return NextResponse.json({ success: false, error: "Post not found" }, { status: 404 });
    }

    const cleanAuthor = (authorName || "Robotics Enthusiast").trim();
    const authorHandle = cleanAuthor.toLowerCase().replace(/[^a-z0-9_]/g, "_") || "enthusiast";

    const newComment = await prisma.communityComment.create({
      data: {
        postId: post.id,
        parentId: parentId || null,
        content: content.trim(),
        authorName: cleanAuthor,
        authorHandle,
        authorBadge: "Community Member",
        isVerified: false,
        upvotes: 1,
        downvotes: 0
      }
    });

    return NextResponse.json({
      success: true,
      comment: {
        id: newComment.id,
        author: {
          id: newComment.authorHandle,
          name: newComment.authorName,
          handle: newComment.authorHandle,
          roleBadge: newComment.authorBadge,
          isVerified: newComment.isVerified
        },
        content: newComment.content,
        createdAt: newComment.createdAt.toISOString(),
        timeAgo: "Just now",
        upvotes: newComment.upvotes,
        downvotes: newComment.downvotes,
        userVote: null,
        replies: []
      }
    });
  } catch (error) {
    console.error("POST /api/community/posts/[id]/comments error:", error);
    return NextResponse.json({ success: false, error: "Failed to post comment" }, { status: 500 });
  }
}
