"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  buildSandboxedMailDocument,
  looksLikeHtml,
} from "@/lib/sanitize-mail-html";

type Props = {
  html?: string | null;
  text?: string | null;
};

export function MailHtmlBody({ html, text }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(240);

  const srcDoc = useMemo(() => {
    const raw = html?.trim();
    if (raw && looksLikeHtml(raw)) return buildSandboxedMailDocument(raw);
    return null;
  }, [html]);

  const resize = useCallback(() => {
    const doc = iframeRef.current?.contentDocument;
    if (!doc) return;
    const next = Math.max(
      doc.documentElement.scrollHeight,
      doc.body?.scrollHeight ?? 0,
      120,
    );
    setHeight(Math.min(next + 8, 8000));
  }, []);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    const doc = iframe.contentDocument;
    if (!doc) return;
    const images = [...doc.images];
    for (const img of images) {
      img.addEventListener("load", resize);
    }
    return () => {
      for (const img of images) {
        img.removeEventListener("load", resize);
      }
    };
  }, [srcDoc, resize]);

  if (!srcDoc) {
    return (
      <div className="whitespace-pre-wrap text-[15px] leading-[1.7] text-[var(--foreground)]/90">
        {text?.trim() || "(Empty message)"}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl bg-white">
      <iframe
        ref={iframeRef}
        title="Email body"
        sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
        srcDoc={srcDoc}
        onLoad={resize}
        className="block w-full border-0 bg-white"
        style={{ height }}
        referrerPolicy="no-referrer"
      />
    </div>
  );
}
