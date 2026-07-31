import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { LinksView } from '@/components/app/links/links-view';

function LinksLoading() {
  return (
    <div className="flex min-h-[240px] items-center justify-center">
      <Loader2 className="size-8 animate-spin text-[var(--primary)]" />
    </div>
  );
}

export default function LinksPage() {
  return (
    <div className="w-full pt-0.75 sm:pt-1.25">
      <Suspense fallback={<LinksLoading />}>
        <LinksView />
      </Suspense>
    </div>
  );
}
