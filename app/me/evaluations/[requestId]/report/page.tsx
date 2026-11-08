import RecordView from "@/components/platform/RecordView";
export default async function Page({ params }: { params: Promise<{ requestId: string }> }) { return <RecordView id={(await params).requestId} />; }
