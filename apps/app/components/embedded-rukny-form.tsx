'use client';

import { useEffect, useState } from 'react';
import { getEmbedConfig } from '@/lib/embed-config';

export function EmbeddedRuknyForm() {
  const { slug, publicOrigin, embedUrl } = getEmbedConfig();
  const [height, setHeight] = useState(320);
  const [ready, setReady] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.origin !== publicOrigin) return;
      if (event.data?.type !== 'rukny:form') return;
      if (event.data.slug !== slug) return;

      if (event.data.event === 'ready') {
        setReady(true);
      }

      if (event.data.event === 'submitted') {
        setSubmitted(true);
      }

      if (event.data.event === 'resize' && typeof event.data.height === 'number') {
        setHeight(Math.min(Math.max(event.data.height, 200), 2000));
        setReady(true);
      }
    }

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [publicOrigin, slug]);

  return (
    <div className="w-full">
      {submitted ? (
        <p
          role="status"
          className="mb-4 rounded-xl border border-emerald-200/80 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"
        >
          تم استلام إرسالك — شكراً لمشاركتك.
        </p>
      ) : null}

      <div
        className="relative w-full overflow-hidden rounded-xl bg-white transition-[min-height] duration-200"
        style={{ minHeight: ready ? undefined : 280 }}
      >
        {!ready ? (
          <div
            className="absolute inset-0 flex items-center justify-center bg-[#fafbfc]"
            aria-hidden
          >
            <div className="size-5 animate-spin rounded-full border-2 border-[#e2e8f0] border-t-[#111]" />
          </div>
        ) : null}

        <iframe
          src={embedUrl}
          title="Rukny Form"
          data-rukny-form={slug}
          width="100%"
          height={height}
          className="block w-full border-0 bg-transparent"
          style={{
            height,
            opacity: ready ? 1 : 0,
            transition: 'opacity 0.2s ease',
          }}
          loading="lazy"
          allow="clipboard-write"
          scrolling="no"
        />
      </div>
    </div>
  );
}
