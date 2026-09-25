import { redirect } from 'next/navigation';
import { isValidProfileUsername } from '@/lib/profile-routes';

type Props = {
  params: Promise<{ username: string }>;
};

/** إعادة توجيه دائمة: /profile/username → /username */
export default async function LegacyProfileRedirect({ params }: Props) {
  const { username } = await params;

  if (!isValidProfileUsername(username)) {
    redirect('/');
  }

  redirect(`/${encodeURIComponent(username)}`);
}
