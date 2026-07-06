import { PlaceholderPage } from '@/components/app/placeholder-page';

export default function DomainsPage() {
  return (
    <PlaceholderPage
      title="الدومينات"
      description="اربط دومينك الحالي وأضف سجلات MX و SPF و DKIM و DMARC. بعد التحقق يمكنك إنشاء صناديق بريد عليه."
      actionHref="/app/mailboxes"
      actionLabel="إدارة صناديق البريد"
    />
  );
}
