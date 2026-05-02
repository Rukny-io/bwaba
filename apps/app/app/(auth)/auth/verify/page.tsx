import { Suspense } from 'react';
import Link from 'next/link';
import { AuthCard } from '@/components/auth/auth-card';
import { VerifyContent } from '@/components/auth/verify-content';

export const metadata = {
  title: 'التحقق من البريد الإلكتروني | ركني',
};

export default function VerifyPage() {
  return (
    <AuthCard>
      <Suspense fallback={<div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" /></div>}>
        <VerifyContent />
      </Suspense>
    </AuthCard>
  );
}
