'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { PanelRightClose, PanelRightOpen, Smartphone, RefreshCw, ExternalLink } from 'lucide-react';
import { PhonePreviewContext } from './phone-preview-context';
import { StoreProfilePreview } from './StoreProfilePreview';

const WEB_URL = process.env.NEXT_PUBLIC_WEB_URL || 'https://rukny.io';
const STORAGE_KEY = 'rukny-app-phone-preview-collapsed';
const FORCE_OPEN_ROUTES: string[] = [];

export function CollapsiblePhonePreview({
  children,
  username,
}: {
  children?: React.ReactNode;
  username?: string | null;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);

  const forceOpen = FORCE_OPEN_ROUTES.some((r) => pathname === r || pathname.startsWith(r + '/'));

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'true') setCollapsed(true);
    } catch {}
    setMounted(true);
  }, []);

  useEffect(() => {
    if (forceOpen && collapsed) setCollapsed(false);
  }, [forceOpen, collapsed]);

  const toggle = useCallback(() => {
    if (forceOpen) return;
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, String(next));
      } catch {}
      return next;
    });
  }, [forceOpen]);

  if (!mounted) return <>{children}</>;

  const storeUrl = username ? `/${username}` : null;

  return (
    <PhonePreviewContext.Provider value={{ collapsed, toggle }}>
      {children}

      <div className="hidden xl:flex h-full relative">
        <button
          onClick={toggle}
          className={[
            'absolute top-3 z-10 flex items-center justify-center',
            'w-8 h-8 rounded-2xl',
            'bg-white dark:bg-[var(--surface)] border border-[var(--border)]/50 shadow-sm',
            'text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-secondary)]',
            'transition-all duration-200',
            collapsed ? 'right-1/2 translate-x-1/2' : '-right-1',
            forceOpen ? 'hidden' : '',
          ].join(' ')}
          title={collapsed ? 'عرض المعاينة' : 'إخفاء المعاينة'}
        >
          {collapsed ? (
            <PanelRightOpen className="size-4" />
          ) : (
            <PanelRightClose className="size-4" />
          )}
        </button>

        <div
          className="h-full overflow-hidden flex-shrink-0 transition-[width] duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]"
          style={{ width: collapsed ? 48 : 320 }}
        >
          {collapsed ? (
            <div className="flex flex-col items-center pt-14 gap-3 h-full">
              <div className="w-9 h-9 rounded-xl bg-[var(--surface-secondary)]/40 flex items-center justify-center">
                <Smartphone className="size-4 text-[var(--muted)]" />
              </div>
              <span className="text-[10px] text-[var(--muted)] [writing-mode:vertical-rl] rotate-180">
                معاينة مباشرة
              </span>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center gap-4">
              <div className="relative w-[280px] flex-shrink-0" style={{ height: 'min(620px, calc(100vh - 200px))' }}>
                <div className="w-full h-full overflow-hidden rounded-3xl ring-1 ring-black/5">
                  <div className="w-full h-full overflow-hidden">
                    <StoreProfilePreview key={previewKey} />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => setPreviewKey((k) => k + 1)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[var(--muted)] bg-[var(--surface-secondary)] hover:bg-[var(--surface)] rounded-2xl transition-colors"
                >
                  <RefreshCw className="size-3.5" />
                  تحديث
                </button>
                {storeUrl && (
                  <a
                    href={storeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-neutral-900 hover:bg-neutral-800 rounded-2xl transition-colors"
                  >
                    <ExternalLink className="size-3.5" />
                    فتح المتجر
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </PhonePreviewContext.Provider>
  );
}