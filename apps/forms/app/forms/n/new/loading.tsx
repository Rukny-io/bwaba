'use client';

import { motion } from 'framer-motion';
import { FilePlus2 } from 'lucide-react';

export default function NewFormDraftLoading() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-3 py-24 sm:px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="flex w-full flex-col items-center gap-6 text-center"
      >
        <div className="form-create-document flex w-full max-w-sm flex-col items-center gap-4 p-8">
          <div className="relative flex items-center justify-center">
            <div className="flex size-16 items-center justify-center rounded-2xl bg-[var(--surface-secondary)] ring-1 ring-[var(--border)]">
              <FilePlus2 className="size-7 text-[var(--foreground)]" />
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-[var(--foreground)] sm:text-xl">
              جاري تحضير مساحة العمل
            </h2>
            <p className="mx-auto max-w-[280px] text-sm leading-relaxed text-[var(--muted-foreground)]">
              نقوم بإنشاء نموذج جديد وتوليد رابط خاص بك للبدء في التعديل…
            </p>
          </div>

          <div className="flex gap-1.5 pt-1">
            <span className="size-2 animate-pulse rounded-full bg-[var(--primary)]" />
            <span className="size-2 animate-pulse rounded-full bg-[var(--primary)] [animation-delay:150ms]" />
            <span className="size-2 animate-pulse rounded-full bg-[var(--primary)] [animation-delay:300ms]" />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
