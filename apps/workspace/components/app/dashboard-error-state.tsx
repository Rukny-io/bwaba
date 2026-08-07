'use client';

import type { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, Button, Card } from '@heroui/react';
import { cn } from '@/lib/utils';

interface DashboardErrorStateProps {
  title?: string;
  description?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  children?: ReactNode;
  className?: string;
  variant?: 'page' | 'inline';
}

export function DashboardErrorState({
  title = 'تعذّر تحميل هذا القسم',
  description = 'قد تكون المشكلة مؤقتة. أعد المحاولة أو انتقل لقسم آخر.',
  message,
  onRetry,
  retryLabel = 'إعادة المحاولة',
  children,
  className,
  variant = 'page',
}: DashboardErrorStateProps) {
  const router = useRouter();

  if (variant === 'inline') {
    return (
      <Alert status="danger" className={className}>
        <Alert.Content>
          <Alert.Description>
            {message ?? description}
            {onRetry ? (
              <button type="button" className="ms-2 underline" onClick={onRetry}>
                {retryLabel}
              </button>
            ) : null}
            {children}
          </Alert.Description>
        </Alert.Content>
      </Alert>
    );
  }

  return (
    <Card
      className={cn(
        'flex min-h-[40vh] flex-col items-center justify-center bg-surface-secondary/30 py-10 text-center sm:py-14',
        className,
      )}
    >
      <Alert status="danger" className="max-w-sm border-0 bg-transparent shadow-none">
        <Alert.Content>
          <Alert.Title>{title}</Alert.Title>
          <Alert.Description>{message ?? description}</Alert.Description>
        </Alert.Content>
      </Alert>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        {onRetry ? (
          <Button variant="primary" onPress={onRetry}>
            {retryLabel}
          </Button>
        ) : null}
        {children ?? (
          <Button variant="secondary" onPress={() => router.push('/app')}>
            لوحة التحكم
          </Button>
        )}
      </div>
    </Card>
  );
}
