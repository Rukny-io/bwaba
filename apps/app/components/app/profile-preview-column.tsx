'use client';

import { usePathname } from 'next/navigation';
import {
  ProfilePreviewAside,
  PREVIEW_COLUMN_MIN_WIDTH_PX,
} from '@/components/app/links/profile-preview-provider';

function shouldHideProfilePreview(pathname: string): boolean {
  return (
    pathname.startsWith('/app/orders') ||
    pathname.startsWith('/app/products') ||
    pathname.startsWith('/app/settings')
  );
}

export function ProfilePreviewColumn() {
  const pathname = usePathname();

  if (shouldHideProfilePreview(pathname)) {
    return null;
  }

  return (
    <div
      className="hidden h-full min-h-0 shrink-0 overflow-hidden xl:flex"
      style={{ width: PREVIEW_COLUMN_MIN_WIDTH_PX }}
    >
      <ProfilePreviewAside />
    </div>
  );
}
