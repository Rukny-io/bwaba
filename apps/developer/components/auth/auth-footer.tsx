'use client';

import Link from 'next/link';
import { ACCOUNTS_URL } from '@/lib/auth-redirect';
import { cn } from '@/lib/utils';

const TERMS_URL = `${ACCOUNTS_URL.replace(/\/$/, '')}/terms`;
const PRIVACY_URL = `${ACCOUNTS_URL.replace(/\/$/, '')}/privacy`;

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
        href={TERMS_URL}
        className="underline underline-offset-3 transition-colors hover:text-foreground"
      >
        Terms of Use
      </Link>
      <span className="mx-2 opacity-40">|</span>
      <Link
        href={PRIVACY_URL}
        className="underline underline-offset-3 transition-colors hover:text-foreground"
      >
        Privacy Policy
      </Link>
    </footer>
  );
}
