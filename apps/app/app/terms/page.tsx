'use client';

import { LegalPage } from '@/components/legal/legal-page';
import { termsContentAr, termsContentEn } from '@/lib/legal/terms-content';

export default function TermsPage() {
  return (
    <LegalPage
      kind="terms"
      contentAr={termsContentAr}
      contentEn={termsContentEn}
    />
  );
}
