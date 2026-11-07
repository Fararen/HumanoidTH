import { prisma } from "../lib/prisma";
import { MOCK_POSTS } from "../app/community/mockData";

async function main() {
  const existingCount = await prisma.communityPost.count();
  if (existingCount > 0) {
    console.log(`Database already has ${existingCount} community posts. Skipping seed.`);
    return;
  }

  console.log(`Seeding ${MOCK_POSTS.length} community posts into PostgreSQL...`);

  for (const post of MOCK_POSTS) {
    await prisma.communityPost.create({
      data: {
        id: post.id,
        slug: post.slug,
        title: post.title,
        content: post.content,
        type: post.type,
        communityName: "r/HumanoidTH",
        authorName: post.author.name,
        authorHandle: post.author.handle,
        authorBadge: post.author.roleBadge || "Community Member",
        isVerified: post.author.isVerified || false,
        mediaUrl: post.mediaUrl,
        tags: post.tags,
        upvotes: post.upvotes,
        downvotes: post.downvotes,
        viewsCount: post.viewsCount,
        isPinned: post.isPinned || false,
        createdAt: new Date(post.createdAt)
      }
    });
  }

  console.log("✅ Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("Error seeding community posts:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
