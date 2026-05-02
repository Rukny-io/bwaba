import type { ReactNode } from 'react';

interface AuthCardProps {
  children: ReactNode;
  className?: string;
}

export function AuthCard({ children, className }: AuthCardProps) {
  return (
    <div className={className}>
      {children}
    </div>
  );
}
