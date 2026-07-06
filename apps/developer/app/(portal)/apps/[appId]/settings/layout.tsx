import type { ReactNode } from 'react';
import { AppSettingsChrome } from '@/components/settings/app-settings-chrome';

export default function AppSettingsLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <AppSettingsChrome>{children}</AppSettingsChrome>;
}
