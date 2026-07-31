'use client';

import React from 'react';

interface AuthShellProps {
  children: React.ReactNode;
  className?: string;
}

export function AuthShell({ children, className = '' }: AuthShellProps) {
  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col font-sans text-[var(--foreground)]">
      <header className="px-4 md:px-6 pt-4">
        <div className="mx-auto w-full max-w-6xl px-4 md:px-6 py-3.5 flex items-center justify-between">
          <span className="text-base md:text-lg font-semibold tracking-tight text-[var(--foreground)]">
            ركني
          </span>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className={`w-full max-w-[420px] flex flex-col items-center ${className}`}>
          {children}
        </div>
      </main>
    </div>
  );
}
