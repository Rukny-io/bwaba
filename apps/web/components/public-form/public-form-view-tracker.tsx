'use client';

import { useEffect, useRef } from 'react';
import { trackPublicFormView } from '@/lib/public-form-api';

export function PublicFormViewTracker({ slug }: { slug: string }) {
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;
    void trackPublicFormView(slug);
  }, [slug]);

  return null;
}
