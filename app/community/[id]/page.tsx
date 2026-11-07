import { notFound } from "next/navigation";
import type { Metadata } from "next";
import PostDetailClient from "./PostDetailClient";
import { MOCK_POSTS, MOCK_COMMENTS } from "../mockData";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const post = MOCK_POSTS.find((p) => p.id === id);
  if (!post) return { title: "Discussion Not Found | HumanoidTH" };

  return {
    title: `${post.title} | HumanoidTH Community`,
    description: post.content.substring(0, 160)
  };
}

export default async function PostDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const post = MOCK_POSTS.find((p) => p.id === id);

  // If not in mock, it might have been created client-side in localStorage,
  // so we pass initialPost or fallback placeholder that PostDetailClient can hydrate from localStorage.
  const comments = MOCK_COMMENTS[id] || [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <PostDetailClient initialPost={post || null} initialComments={comments} postId={id} />
    </div>
  );
}
