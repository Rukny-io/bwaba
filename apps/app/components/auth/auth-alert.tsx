'use client';


import type { ReactNode } from 'react';

interface AuthErrorProps {
  message: string | null | undefined;
}

/**
 * عرض رسالة خطأ موحدة في صفحات Auth.
 */
export function AuthError({ message }: AuthErrorProps) {
  if (!message) return null;
  return (
    <div className="mb-5 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-red-600 dark:text-red-400 text-sm text-center">
      {message}
    </div>
  );
}

interface AuthSuccessProps {
  message: string | null | undefined;
  children?: ReactNode;
}

/**
 * عرض رسالة نجاح موحدة في صفحات Auth.
 */
export function AuthSuccess({ message, children }: AuthSuccessProps) {
  if (!message && !children) return null;
  return (
    <div className="mb-5 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 px-4 py-3 text-green-700 dark:text-green-400 text-sm text-center">
      {message}
      {children}
    </div>
  );
}
