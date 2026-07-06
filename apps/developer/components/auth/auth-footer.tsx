'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';

interface AuthFooterProps {
  className?: string;
}

export function AuthFooter({ className }: AuthFooterProps) {
  return (
    <footer
      className={cn(
        'mt-10 flex items-center justify-center gap-1 text-xs text-muted-foreground',
        className,
      )}
    >
      <Link
        href="https://rukny.io/terms"
        className="underline underline-offset-3 transition-colors hover:text-foreground"
      >
        Terms of Use
      </Link>
      <span className="mx-2 opacity-40">|</span>
      <Link
        href="https://rukny.io/privacy"
        className="underline underline-offset-3 transition-colors hover:text-foreground"
      >
        Privacy Policy
      </Link>
    </footer>
  );
}
