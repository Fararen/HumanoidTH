import type { Metadata } from "next";
import SubmitPostClient from "./SubmitPostClient";
import { MOCK_TOPICS } from "../mockData";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Create Post | r/HumanoidTH",
  description: "Create a discussion, ask a technical question, or showcase your robotics project on HumanoidTH.",
  alternates: { canonical: "/community/submit" }
};

export default function SubmitPostPage() {
  return (
    <div style={{ maxWidth: 1080, margin: "0 auto", paddingBottom: 40 }}>
      <SubmitPostClient topics={MOCK_TOPICS} />
    </div>
  );
}
