import type { Metadata } from 'next';
import './form-ui.css';

export const metadata: Metadata = {
  robots: { index: true, follow: true },
};

export default function PublicFormLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="public-form-route min-h-dvh bg-[var(--background)] text-[var(--foreground)]">
      {children}
    </div>
  );
}
