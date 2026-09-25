'use client';

import { usePathname } from 'next/navigation';
import { RadialBackground } from '@/components/ui/light-theme-tailwind-css-background-snippet';

/** Marketing radial glow — hidden on public form routes (`/f/*`). */
export function SiteBackground() {
  const pathname = usePathname();
  if (pathname === '/f' || pathname?.startsWith('/f/')) {
    return null;
  }
  return <RadialBackground />;
}
