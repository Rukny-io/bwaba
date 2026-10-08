import type { Viewport } from 'next';

export const viewport: Viewport = {
  themeColor: '#ffffff',
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
