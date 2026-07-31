import { SupportTicketDetailPanel } from "@/components/manage/support-ticket-detail-panel";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function SupportTicketDetailPage({ params }: PageProps) {
  const { id } = await params;
  return <SupportTicketDetailPanel ticketId={id} />;
}
