import { notFound } from "next/navigation";
import type { Metadata } from "next";
import PostDetailClient from "./PostDetailClient";
import { MOCK_POSTS, MOCK_COMMENTS } from "../mockData";
import { prisma } from "@/lib/prisma";
import { CommunityPost, PostComment } from "../types";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  try {
    const post = await prisma.communityPost.findFirst({
      where: { OR: [{ id }, { slug: id }] },
      select: { title: true, content: true }
    });
    if (post) {
      return {
        title: `${post.title} | HumanoidTH Community`,
        description: post.content.substring(0, 160)
      };
    }
  } catch {}

  const mock = MOCK_POSTS.find((p) => p.id === id || p.slug === id);
  if (!mock) return { title: "Discussion | HumanoidTH Community" };

  return {
    title: `${mock.title} | HumanoidTH Community`,
    description: mock.content.substring(0, 160)
  };
}

export default async function PostDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let post: CommunityPost | null = null;
  let comments: PostComment[] = [];

  try {
    const dbPost = await prisma.communityPost.findFirst({
      where: { OR: [{ id }, { slug: id }] },
      include: {
        comments: { orderBy: { createdAt: "asc" } },
        _count: { select: { comments: true } }
      }
    });

    if (dbPost) {
      const commentMap = new Map<string, PostComment>();
      const rootComments: PostComment[] = [];

      dbPost.comments.forEach((c) => {
        const item: PostComment = {
          id: c.id,
          postId: c.postId,
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
        commentMap.set(c.id, item);
      });

      dbPost.comments.forEach((c) => {
        const item = commentMap.get(c.id)!;
        if (c.parentId && commentMap.has(c.parentId)) {
          commentMap.get(c.parentId)!.replies!.push(item);
        } else {
          rootComments.push(item);
        }
      });

      post = {
        id: dbPost.id,
        slug: dbPost.slug,
        title: dbPost.title,
        content: dbPost.content,
        type: dbPost.type as any,
        communityName: dbPost.communityName,
        author: {
          id: dbPost.authorHandle,
          name: dbPost.authorName,
          handle: dbPost.authorHandle,
          roleBadge: dbPost.authorBadge,
          isVerified: dbPost.isVerified
        },
        tags: dbPost.tags,
        createdAt: dbPost.createdAt.toISOString(),
        timeAgo: "Recently",
        upvotes: dbPost.upvotes,
        downvotes: dbPost.downvotes,
        userVote: null,
        commentsCount: dbPost._count.comments,
        viewsCount: dbPost.viewsCount,
        isBookmarked: false,
        isPinned: dbPost.isPinned,
        mediaUrl: dbPost.mediaUrl || undefined
      };
      comments = rootComments;
    }
  } catch (err) {
    console.warn("Could not query post from DB, using fallback:", err);
  }

  if (!post) {
    post = MOCK_POSTS.find((p) => p.id === id || p.slug === id) || null;
    comments = MOCK_COMMENTS[id] || [];
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <PostDetailClient initialPost={post} initialComments={comments} postId={id} />
    </div>
  );
}
