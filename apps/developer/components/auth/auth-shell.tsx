'use client';

interface AuthShellProps {
  children: React.ReactNode;
  className?: string;
}

export function AuthShell({ children, className = '' }: AuthShellProps) {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--background)] font-sans text-[var(--foreground)]">
      <header className="px-4 pt-4 md:px-6">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3.5 md:px-6">
          <div className="flex items-center gap-3">
            <span className="text-base font-semibold tracking-tight text-[var(--foreground)] md:text-lg">
              ركني — مطوّرين
            </span>
          </div>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div
          className={`flex w-full max-w-[420px] flex-col items-center ${className}`}
        >
          {children}
        </div>
      </main>
    </div>
  );
}
