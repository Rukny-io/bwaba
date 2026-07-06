import type { ReactNode } from 'react';

export function AppsFlowShell({
  children,
  size = 'md',
}: {
  children: ReactNode;
  size?: 'md' | 'lg';
}) {
  const maxWidth = size === 'lg' ? 'max-w-3xl' : 'max-w-md';

  return (
    <div className="flex min-h-dvh items-center justify-center px-3 py-8 sm:px-6 sm:py-10">
      <div className={`w-full ${maxWidth}`}>{children}</div>
    </div>
  );
}
