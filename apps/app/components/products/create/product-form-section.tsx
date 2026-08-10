'use client';

import type { ReactNode } from 'react';
import { Card, cn } from '@heroui/react';

interface ProductFormSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}

export function ProductFormSection({
  title,
  description,
  children,
  className,
  contentClassName,
}: ProductFormSectionProps) {
  return (
    <Card variant="secondary" className={cn('gap-4 p-4 sm:p-5', className)}>
      <Card.Header className="gap-1 p-0">
        <Card.Title className="text-sm font-bold">{title}</Card.Title>
        {description ? (
          <Card.Description className="text-xs leading-relaxed">
            {description}
          </Card.Description>
        ) : null}
      </Card.Header>
      <Card.Content className={cn('flex flex-col gap-4 p-0', contentClassName)}>
        {children}
      </Card.Content>
    </Card>
  );
}
