import { redirect } from 'next/navigation';

export default function AppearanceSettingsPage() {
  redirect('/app/settings?section=appearance');
}
