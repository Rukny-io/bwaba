'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export interface DocTocItem {
  id: string;
  label: string;
}

export function DocsOnThisPage({ items }: { items: DocTocItem[] }) {
  const [activeId, setActiveId] = useState(items[0]?.id ?? null);

  useEffect(() => {
    if (!items.length) return;

    const handleScroll = () => {
      let current: string | null = null;
      for (const item of items) {
        const el = document.getElementById(item.id);
        if (!el) continue;
        if (el.getBoundingClientRect().top <= 96) {
          current = item.id;
        } else {
          break;
        }
      }
      setActiveId(current ?? items[0]?.id ?? null);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [items]);

  if (!items.length) return null;

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.scrollY - 72;
    window.scrollTo({ top: y, behavior: 'smooth' });
  };

  return (
    <aside className="hidden shrink-0 xl:block">
      <nav
        aria-label="On this page"
        className="sticky top-14 max-h-[calc(100dvh-3.5rem)] overflow-y-auto overscroll-contain sm:top-[3.75rem] sm:max-h-[calc(100dvh-3.75rem)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <p className="mb-2 px-3 text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--muted-foreground)]">
          On this page
        </p>
        <div className="flex flex-col border-s border-[var(--border)] ps-px">
          {items.map((item) => {
            const active = activeId === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => scrollTo(item.id)}
                className={cn(
                  '-ms-px border-s-2 py-1 ps-3 pe-1.5 text-start text-[12.5px] leading-5 transition-colors',
                  active
                    ? 'border-[var(--foreground)] font-medium text-[var(--foreground)]'
                    : 'border-transparent text-[var(--muted-foreground)] hover:border-[var(--border)] hover:text-[var(--foreground)]',
                )}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </nav>
    </aside>
  );
}
