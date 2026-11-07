import { redirect } from "next/navigation";
import { DEFAULT_GROUP_ID } from "@/lib/company-leaderboard";

export default function CompanyLeaderboardRootPage() {
  redirect(`/leaderboards/company/${DEFAULT_GROUP_ID}`);
}
