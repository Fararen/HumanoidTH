import type { Metadata } from "next";
import CommunityClient from "./CommunityClient";
import { MOCK_POSTS, MOCK_TOPICS } from "./mockData";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Robotics Community & Discussions | HumanoidTH",
  description: "Connect with robotics engineers, researchers, students, and makers in Thailand. Ask questions, share open-source hardware, and discuss embodied AI.",
  alternates: { canonical: "/community" }
};

export default function CommunityPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <CommunityClient initialPosts={MOCK_POSTS} topics={MOCK_TOPICS} />
    </div>
  );
}
