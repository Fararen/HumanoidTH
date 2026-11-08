import Link from "next/link";
import type { Metadata } from "next";
import CommunityClient from "./CommunityClient";
import { MOCK_TOPICS } from "./mockData";
import { prisma } from "@/lib/prisma";
import { CommunityPost } from "./types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Robotics Community & Discussions | HumanoidTH",
  description: "Connect with robotics engineers, researchers, students, and makers in Thailand. Ask questions, share open-source hardware, and discuss embodied AI.",
  alternates: { canonical: "/community" }
};

export default async function CommunityPage() {
  let posts: CommunityPost[] = [];
  let unavailable = false;

  try {
    const dbPosts = await prisma.communityPost.findMany({
      where: { visibilityStatus: "PUBLISHED" },
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
      include: {
        _count: {
          select: { comments: true }
        }
      }
    });

    if (dbPosts.length > 0) {
      posts = dbPosts.map((p) => {
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
          type: p.type as any,
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
          userVote: null,
          commentsCount: p._count.comments,
          viewsCount: p.viewsCount,
          isBookmarked: false,
          isPinned: p.isPinned,
          mediaUrl: p.mediaUrl || undefined
        };
      });
    }
  } catch (err) {
    unavailable = true;
    console.warn("Could not load community posts from PostgreSQL:", err);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {unavailable && <p role="alert">Community posts are temporarily unavailable. Please retry.</p>}
      <nav className="platform-links"><Link href="/community/drafts">ร่างในบัญชี · Account drafts</Link><Link href="/community/drafts/new">เขียนโพสต์ · Write post</Link></nav><CommunityClient initialPosts={posts} topics={MOCK_TOPICS} />
    </div>
  );
}
