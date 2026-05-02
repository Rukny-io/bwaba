import { redirect } from 'next/navigation';

export const metadata = {
  title: 'أكمل ملفك الشخصي | ركني',
};

export default function CompleteProfilePage() {
  // Token is required — redirect to login if accessed without one
  redirect('/login');
}
