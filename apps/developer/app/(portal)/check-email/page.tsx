'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthShell } from '@/components/auth/auth-shell';
import { CheckEmailCard } from '@/components/auth/check-email-card';
import { resendMagicLink } from '@/lib/api';

export default function CheckEmailPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');

  useEffect(() => {
    const storedEmail = sessionStorage.getItem('auth_email');
    if (!storedEmail) {
      router.replace('/login');
      return;
    }
    setEmail(storedEmail);
  }, [router]);

  if (!email) return null;

  return (
    <AuthShell>
      <CheckEmailCard
        email={email}
        onResend={async () => {
          await resendMagicLink(email);
        }}
        onTryOtherMethod={() => router.push('/login')}
      />
    </AuthShell>
  );
}
