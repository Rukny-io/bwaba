'use client';

import { Building2, X } from 'lucide-react';
import { writeActiveWorkspaceIdInBrowser } from '@/lib/workspace';

interface ForeignWorkspaceBannerProps {
  ownerName: string;
  roleLabel: string;
}

/**
 * شريط تنبيه دائم أعلى الصفحة عندما يعمل المستخدم داخل مساحة عمل ليست له.
 * يمنع اللبس ويوفر زر عودة سريعة إلى المساحة الشخصية.
 */
export function ForeignWorkspaceBanner({
  ownerName,
  roleLabel,
}: ForeignWorkspaceBannerProps) {
  const handleReset = () => {
    writeActiveWorkspaceIdInBrowser(null);
    if (typeof window !== 'undefined') window.location.reload();
  };

  return (
    <div
      role="status"
      className="sticky top-0 z-40 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 bg-amber-500/95 px-3 py-1.5 text-center text-xs font-medium text-black shadow-sm sm:text-sm dark:bg-amber-400"
    >
      <span className="inline-flex items-center gap-1.5">
        <Building2 className="size-3.5 shrink-0" aria-hidden />
        <span>
          تعمل الآن داخل مساحة{' '}
          <span className="font-bold">{ownerName}</span>
        </span>
      </span>
      <span className="rounded-full bg-black/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide">
        {roleLabel}
      </span>
      <button
        type="button"
        onClick={handleReset}
        className="inline-flex items-center gap-1 rounded-full bg-black/10 px-2.5 py-0.5 text-xs font-semibold text-black transition-colors hover:bg-black/20"
      >
        <X className="size-3" aria-hidden />
        العودة إلى مساحتي
      </button>
    </div>
  );
}
