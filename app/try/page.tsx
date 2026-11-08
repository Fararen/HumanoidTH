import type { Metadata } from "next";
import TryWorkspace from "./TryWorkspace";

export const metadata: Metadata = { title: "ทดลองใช้งาน | HumanoidTH", robots: { index: false, follow: false } };

export default function TryPage() {
  return <TryWorkspace />;
}
