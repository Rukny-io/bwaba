'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, X } from 'lucide-react';
import { Button } from '@heroui/react';
import { DesignCustomizeSections } from '@/components/forms/form-create/design/design-customize-sections';
import type { FormTheme } from '@/lib/form-theme';
import { cn } from '@/lib/utils';

interface FormCreateCustomizePanelProps {
  open: boolean;
  onClose: () => void;
  theme: FormTheme;
  onThemeChange: (theme: FormTheme) => void;
}

export function FormCreateCustomizePanel({
  open,
  onClose,
  theme,
  onThemeChange,
}: FormCreateCustomizePanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollDown, setCanScrollDown] = useState(false);

  const updateScrollHint = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;

    const hasMoreBelow =
      el.scrollTop + el.clientHeight < el.scrollHeight - 8;
    setCanScrollDown(hasMoreBelow);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;

    updateScrollHint();
    const el = scrollRef.current;
    if (!el) return;

    const observer = new ResizeObserver(updateScrollHint);
    observer.observe(el);
    return () => observer.disconnect();
  }, [open, theme, updateScrollHint]);

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            aria-label="إغلاق"
            className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 360 }}
            className={cn(
              'fixed inset-y-0 start-0 z-[110] flex w-full max-w-[22rem] flex-col sm:max-w-md m-4 rounded-2xl',
              'max-h-[calc(100dvh-3rem)] border-e border-[var(--border)] bg-[var(--background)] shadow-2xl',
            )}
            role="dialog"
            aria-modal="true"
            aria-label="تخصيص التصميم"
          >
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[var(--border)] px-4 py-3.5 sm:px-5">
              <div className="min-w-0 text-right">
                <h2 className="text-base font-semibold text-[var(--foreground)]">
                  تخصيص التصميم
                </h2>
                <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                  الألوان والتخطيط
                </p>
              </div>
              <Button
                isIconOnly
                size="sm"
                variant="tertiary"
                aria-label="إغلاق"
                onPress={onClose}
                className="shrink-0 rounded-xl"
              >
                <X className="size-4" />
              </Button>
            </div>

            <div className="relative min-h-0 flex-1">
              <div
                ref={scrollRef}
                onScroll={updateScrollHint}
                className={cn(
                  'h-full overflow-y-auto overscroll-contain px-4 py-4 sm:px-5 sm:py-5',
                  '[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
                  canScrollDown && 'pb-10',
                )}
              >
                <DesignCustomizeSections
                  theme={theme}
                  onThemeChange={onThemeChange}
                />
              </div>

              <AnimatePresence>
                {canScrollDown ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="pointer-events-none absolute inset-x-0 bottom-0"
                    aria-hidden
                  >
                    <div className="h-20 rounded-b-2xl bg-gradient-to-t from-[var(--background)] via-[var(--background)]/80 to-transparent" />
                    <div className="absolute inset-x-0 bottom-3 flex items-center justify-center gap-1 text-[11px] text-[var(--muted-foreground)]">
                      <ChevronDown className="size-3.5 animate-bounce" />
                      <span>المزيد بالأسفل</span>
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
