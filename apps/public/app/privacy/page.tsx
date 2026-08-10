'use client';

import { LegalPage } from '@/components/legal/legal-page';
import { privacyContentAr, privacyContentEn } from '@/lib/legal/privacy-content';

export default function PrivacyPolicyPage() {
  return (
    <LegalPage
      kind="privacy"
      contentAr={privacyContentAr}
      contentEn={privacyContentEn}
    />
  );
}
