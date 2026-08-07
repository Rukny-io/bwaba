import { PlaceholderPage } from '@/components/app/placeholder-page';
import { ComposeMailButton } from '@/components/app/compose-mail-button';

export default function MailInboxPage() {
  return (
    <div className="w-full pt-6 sm:pt-8">
      <PlaceholderPage
        title="صندوق الوارد"
        description="ستظهر هنا الرسائل الواردة بعد ربط الدومين وتفعيل الاستقبال عبر Amazon SES. يدعم MVP المحادثات (threads) والرد المباشر."
      />
      <div className="mt-6">
        <ComposeMailButton />
      </div>
    </div>
  );
}
