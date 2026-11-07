import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sort = searchParams.get("sort") || "hot";
    const flair = searchParams.get("flair");
    const tag = searchParams.get("tag");
    const search = searchParams.get("search");

    const where: any = {};

    if (flair && flair !== "ALL") {
      where.type = flair.toUpperCase();
    }

    if (tag) {
      where.tags = { has: tag };
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { content: { contains: search, mode: "insensitive" } },
        { tags: { has: search } }
      ];
    }

    let orderBy: any = [{ isPinned: "desc" }, { createdAt: "desc" }];

    if (sort === "new") {
      orderBy = [{ isPinned: "desc" }, { createdAt: "desc" }];
    } else if (sort === "top") {
      orderBy = [{ isPinned: "desc" }, { upvotes: "desc" }, { createdAt: "desc" }];
    } else if (sort === "rising") {
      orderBy = [{ isPinned: "desc" }, { viewsCount: "desc" }, { createdAt: "desc" }];
    } else {
      // Hot: combined score
      orderBy = [{ isPinned: "desc" }, { upvotes: "desc" }, { createdAt: "desc" }];
    }

    const posts = await prisma.communityPost.findMany({
      where,
      orderBy,
      include: {
        _count: {
          select: { comments: true }
        }
      }
    });

    const formatted = posts.map((p) => {
      // Calculate human-friendly timeAgo
      const diffMs = Date.now() - p.createdAt.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      let timeAgo = `${diffMins}m ago`;
      if (diffDays > 0) timeAgo = `${diffDays}d ago`;
      else if (diffHours > 0) timeAgo = `${diffHours}h ago`;
      else if (diffMins < 1) timeAgo = "Just now";

      return {
        id: p.id,
        slug: p.slug,
        title: p.title,
        content: p.content,
        type: p.type,
        communityName: p.communityName,
        author: {
          id: p.authorHandle,
          name: p.authorName,
          handle: p.authorHandle,
          roleBadge: p.authorBadge,
          isVerified: p.isVerified
        },
        tags: p.tags,
        createdAt: p.createdAt.toISOString(),
        timeAgo,
        upvotes: p.upvotes,
        downvotes: p.downvotes,
        commentsCount: p._count.comments,
        viewsCount: p.viewsCount,
        isPinned: p.isPinned,
        mediaUrl: p.mediaUrl || undefined
      };
    });

    return NextResponse.json({ success: true, posts: formatted });
  } catch (error) {
    console.error("GET /api/community/posts error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch community posts" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, content, type, tags, mediaUrl, authorName } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ success: false, error: "Title is required" }, { status: 400 });
    }

    // Generate unique slug
    const baseSlug = title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || `post-${Date.now()}`;
    const slug = `${baseSlug}-${Date.now().toString(36)}`;

    const tagsArray = Array.isArray(tags)
      ? tags
      : typeof tags === "string"
      ? tags.split(",").map((t: string) => t.trim().replace(/^#/, "")).filter(Boolean)
      : ["Humanoid", "Robotics"];

    const cleanAuthor = (authorName || "Robotics Explorer").trim();
    const authorHandle = cleanAuthor.toLowerCase().replace(/[^a-z0-9_]/g, "_") || "robotics_explorer";

    const newPost = await prisma.communityPost.create({
      data: {
        slug,
        title: title.trim(),
        content: (content || "").trim(),
        type: type || "DISCUSSION",
        communityName: "r/HumanoidTH",
        authorName: cleanAuthor,
        authorHandle,
        authorBadge: "Community Member",
        isVerified: false,
        mediaUrl: mediaUrl?.trim() || null,
        tags: tagsArray.length > 0 ? tagsArray : ["Humanoid", "Robotics"],
        upvotes: 1,
        downvotes: 0,
        viewsCount: 1,
        isPinned: false
      }
    });

    return NextResponse.json({ success: true, post: newPost });
  } catch (error) {
    console.error("POST /api/community/posts error:", error);
    return NextResponse.json({ success: false, error: "Failed to create post" }, { status: 500 });
  }
}
