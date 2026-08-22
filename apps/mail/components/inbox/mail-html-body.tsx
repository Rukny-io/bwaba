"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  adaptSandboxedMailToWidth,
  buildSandboxedMailDocument,
  looksLikeHtml,
} from "@/lib/sanitize-mail-html";

type Props = {
  html?: string | null;
  text?: string | null;
};

export function MailHtmlBody({ html, text }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(240);

  const srcDoc = useMemo(() => {
    const raw = html?.trim();
    if (raw && looksLikeHtml(raw)) return buildSandboxedMailDocument(raw);
    return null;
  }, [html]);

  const fit = useCallback(() => {
    const iframe = iframeRef.current;
    const doc = iframe?.contentDocument;
    if (!iframe || !doc?.body) return;
    const frameWidth = Math.round(
      hostRef.current?.clientWidth || iframe.clientWidth,
    );
    const { height: next } = adaptSandboxedMailToWidth(doc, frameWidth);
    setHeight(Math.min(next + 8, 8000));
  }, []);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    const doc = iframe.contentDocument;
    if (!doc) return;
    const images = [...doc.images];
    for (const img of images) {
      img.addEventListener("load", fit);
    }
    return () => {
      for (const img of images) {
        img.removeEventListener("load", fit);
      }
    };
  }, [srcDoc, fit]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let lastWidth = host.clientWidth;
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? 0;
      if (Math.abs(width - lastWidth) < 1) return;
      lastWidth = width;
      window.requestAnimationFrame(fit);
    });
    observer.observe(host);
    return () => observer.disconnect();
  }, [srcDoc, fit]);

  if (!srcDoc) {
    return (
      <div className="whitespace-pre-wrap break-words px-0.5 text-[15px] leading-[1.7] text-[var(--foreground)]/90">
        {text?.trim() || "(Empty message)"}
      </div>
    );
  }

  return (
    <div
      ref={hostRef}
      className="overflow-hidden rounded-2xl bg-white"
    >
      <iframe
        ref={iframeRef}
        title="Email body"
        sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
        srcDoc={srcDoc}
        onLoad={fit}
        className="block w-full border-0 bg-white"
        style={{ height, overflow: "hidden" }}
        referrerPolicy="no-referrer"
      />
    </div>
  );
}
