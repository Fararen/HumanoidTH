import RecordView from "@/components/platform/RecordView";
export default async function Page({ params }: { params: Promise<{ entryId: string }> }) { return <RecordView id={(await params).entryId} />; }
