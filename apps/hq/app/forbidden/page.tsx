import Link from 'next/link';
import { Button } from '@heroui/react';
import { AuthShell } from '@/components/auth/auth-shell';
import { ShieldX } from 'lucide-react';

const ACCOUNTS_URL =
  process.env.NEXT_PUBLIC_ACCOUNTS_URL || 'http://localhost:3005';

export default function ForbiddenPage() {
  return (
    <AuthShell>
      <section className="w-full dashboard-card rounded-2xl px-6 py-8 text-center">
        <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-[var(--danger)]/10 text-[var(--danger)]">
          <ShieldX size={28} />
        </div>
        <h1 className="text-2xl font-bold mb-2">Access denied</h1>
        <p className="text-sm text-[var(--muted-foreground)] leading-relaxed mb-6">
          The HQ panel is restricted to admin accounts only. If you believe this
          is a mistake, contact the support team.
        </p>
        <div className="flex flex-col gap-2">
          <Link href="/login" className="w-full">
            <Button className="w-full rounded-full">Back to sign in</Button>
          </Link>
          <a href={ACCOUNTS_URL} className="w-full">
            <Button className="w-full rounded-full" variant="outline">
              Go to Accounts
            </Button>
          </a>
        </div>
      </section>
    </AuthShell>
  );
}
