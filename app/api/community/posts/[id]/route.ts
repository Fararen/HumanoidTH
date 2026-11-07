import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Find by slug or id
    const post = await prisma.communityPost.findFirst({
      where: {
        OR: [{ id }, { slug: id }]
      },
      include: {
        comments: {
          orderBy: { createdAt: "asc" }
        }
      }
    });

    if (!post) {
      return NextResponse.json({ success: false, error: "Post not found" }, { status: 404 });
    }

    // Increment views safely in background
    prisma.communityPost.update({
      where: { id: post.id },
      data: { viewsCount: { increment: 1 } }
    }).catch(() => {});

    // Build hierarchical comment tree
    const commentMap = new Map<string, any>();
    const rootComments: any[] = [];

    post.comments.forEach((c) => {
      const formatted = {
        id: c.id,
        author: {
          id: c.authorHandle,
          name: c.authorName,
          handle: c.authorHandle,
          roleBadge: c.authorBadge,
          isVerified: c.isVerified
        },
        content: c.content,
        createdAt: c.createdAt.toISOString(),
        timeAgo: "Recently",
        upvotes: c.upvotes,
        downvotes: c.downvotes,
        userVote: null,
        replies: []
      };
      commentMap.set(c.id, formatted);
    });

    post.comments.forEach((c) => {
      const formatted = commentMap.get(c.id);
      if (c.parentId && commentMap.has(c.parentId)) {
        commentMap.get(c.parentId).replies.push(formatted);
      } else {
        rootComments.push(formatted);
      }
    });

    return NextResponse.json({
      success: true,
      post: {
        id: post.id,
        slug: post.slug,
        title: post.title,
        content: post.content,
        type: post.type,
        communityName: post.communityName,
        author: {
          id: post.authorHandle,
          name: post.authorName,
          handle: post.authorHandle,
          roleBadge: post.authorBadge,
          isVerified: post.isVerified
        },
        tags: post.tags,
        createdAt: post.createdAt.toISOString(),
        timeAgo: "Recently",
        upvotes: post.upvotes,
        downvotes: post.downvotes,
        viewsCount: post.viewsCount + 1,
        isPinned: post.isPinned,
        mediaUrl: post.mediaUrl || undefined
      },
      comments: rootComments
    });
  } catch (error) {
    console.error("GET /api/community/posts/[id] error:", error);
    return NextResponse.json({ success: false, error: "Failed to load post" }, { status: 500 });
  }
}
