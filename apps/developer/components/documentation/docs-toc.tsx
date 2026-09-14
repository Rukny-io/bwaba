'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export interface DocTocItem {
  id: string;
  label: string;
}

export function DocsOnThisPage({ items }: { items: DocTocItem[] }) {
  const [activeId, setActiveId] = useState(items[0]?.id);

  useEffect(() => {
    if (!items.length) return;
    const elements = items
      .map((item) => document.getElementById(item.id))
      .filter((el): el is HTMLElement => Boolean(el));

    if (!elements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]?.target?.id) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: '-18% 0px -65% 0px', threshold: [0, 0.25, 0.5, 1] },
    );

    for (const el of elements) observer.observe(el);
    return () => observer.disconnect();
  }, [items]);

  if (!items.length) return null;

  return (
    <aside className="hidden w-44 shrink-0 xl:block">
      <div className="sticky top-[4.5rem]">
        <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--muted-foreground)]">
          On this page
        </p>
        <nav className="flex flex-col gap-0.5" aria-label="On this page">
          {items.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className={cn(
                'rounded-md px-2 py-1.5 text-[12.5px] leading-5 transition-colors',
                activeId === item.id
                  ? 'bg-[var(--surface-secondary)] font-medium text-[var(--foreground)]'
                  : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]',
              )}
            >
              {item.label}
            </a>
          ))}
        </nav>
      </div>
    </aside>
  );
}
