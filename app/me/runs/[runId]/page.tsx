import RecordView from "@/components/platform/RecordView";
export default async function Page({ params }: { params: Promise<{ runId: string }> }) { return <RecordView id={(await params).runId} />; }
