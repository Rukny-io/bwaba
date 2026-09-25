'use client';

import { useEffect } from 'react';

const RUKNY_FORM_MESSAGE = 'rukny:form';

export type RuknyFormEmbedEvent =
  | { type: typeof RUKNY_FORM_MESSAGE; event: 'ready'; slug: string }
  | { type: typeof RUKNY_FORM_MESSAGE; event: 'submitted'; slug: string }
  | { type: typeof RUKNY_FORM_MESSAGE; event: 'resize'; slug: string; height: number };

type RuknyFormEmbedPayload =
  | { event: 'ready'; slug: string }
  | { event: 'submitted'; slug: string }
  | { event: 'resize'; slug: string; height: number };

export function useFormEmbedMessaging(slug: string, enabled: boolean) {
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    const post = (payload: RuknyFormEmbedPayload) => {
      window.parent.postMessage({ type: RUKNY_FORM_MESSAGE, ...payload }, '*');
    };

    post({ event: 'ready', slug });

    document.documentElement.classList.add('rukny-embed');
    document.body.classList.add('rukny-embed');

    const reportHeight = () => {
      const height = Math.ceil(
        Math.max(document.body.offsetHeight, document.documentElement.offsetHeight),
      );
      post({ event: 'resize', slug, height: Math.max(height, 200) });
    };

    reportHeight();

    const observer = new ResizeObserver(() => reportHeight());
    observer.observe(document.body);

    return () => {
      observer.disconnect();
      document.documentElement.classList.remove('rukny-embed');
      document.body.classList.remove('rukny-embed');
    };
  }, [slug, enabled]);
}

export function notifyFormEmbedSubmitted(slug: string, enabled: boolean) {
  if (!enabled || typeof window === 'undefined') return;
  window.parent.postMessage(
    {
      type: RUKNY_FORM_MESSAGE,
      event: 'submitted',
      slug,
    },
    '*',
  );
}
