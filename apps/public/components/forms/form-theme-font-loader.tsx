'use client';

import { useEffect } from 'react';

function fontLinkId(fontFamily: string): string {
  return `form-theme-font-${fontFamily.replace(/\s+/g, '-').toLowerCase()}`;
}

export function FormThemeFontLoader({
  href,
  fontFamily,
}: {
  href: string;
  fontFamily: string;
}) {
  useEffect(() => {
    if (!href || !fontFamily) return;

    const id = fontLinkId(fontFamily);
    let link = document.getElementById(id) as HTMLLinkElement | null;

    if (!link) {
      link = document.createElement('link');
      link.id = id;
      link.rel = 'stylesheet';
      link.href = href;
      document.head.appendChild(link);
      return;
    }

    if (link.href !== href) {
      link.href = href;
    }
  }, [href, fontFamily]);

  return null;
}
