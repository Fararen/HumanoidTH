import { GuestStart } from "@/app/components/GuestSession";
import { localRedirectPath } from "@/lib/redirect-path";

export default async function GuestPage({ searchParams }: { searchParams: Promise<{ from?: string }> }) {
  const { from } = await searchParams;
  return <GuestStart destination={localRedirectPath(from || "/me")} />;
}
