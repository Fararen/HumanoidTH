import RecordView from "@/components/platform/RecordView";
export default async function Page({ params }: { params: Promise<{ id: string }> }) { return <RecordView id={(await params).id} publicOnly />; }
