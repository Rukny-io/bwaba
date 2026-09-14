import { getDashboardUser } from '@/lib/dal';
import { EmailApiTryIt } from '@/components/email-api/email-api-try-it';

export default async function EmailApiTryPage() {
  const user = await getDashboardUser();
  return <EmailApiTryIt accountEmail={user.email ?? ''} />;
}
