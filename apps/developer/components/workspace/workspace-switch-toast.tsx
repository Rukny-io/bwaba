'use client';

import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';

const STORAGE_KEY = 'workspace_just_switched';

/** يستدعيه المبدّل قبل إعادة التحميل ليعرض توست بعد التبديل. */
export function markWorkspaceSwitched(label: string): void {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, label);
  } catch {
    /* noop */
  }
}

export function WorkspaceSwitchToast() {
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = window.sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        setLabel(stored);
        window.sessionStorage.removeItem(STORAGE_KEY);
        const t = window.setTimeout(() => setLabel(null), 3500);
        return () => window.clearTimeout(t);
      }
    } catch {
      /* noop */
    }
  }, []);

  if (!label) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 start-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm shadow-lg animate-in fade-in slide-in-from-bottom-2"
    >
      <span className="flex size-5 items-center justify-center rounded-full bg-emerald-500 text-white">
        <Check className="size-3" />
      </span>
      <span>
        تم التبديل إلى مساحة{' '}
        <span className="font-semibold">{label}</span>
      </span>
    </div>
  );
}
