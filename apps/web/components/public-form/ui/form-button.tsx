'use client';

import type { ReactNode } from 'react';
import { Button, type ButtonProps } from '@heroui/react';
import { cn } from '@/lib/utils';

type FormButtonVariant = 'primary' | 'secondary' | 'outline';

const variantMap: Record<FormButtonVariant, ButtonProps['variant']> = {
  primary: 'primary',
  secondary: 'secondary',
  outline: 'outline',
};

export interface FormButtonProps extends Omit<ButtonProps, 'variant'> {
  variant?: FormButtonVariant;
  children: ReactNode;
}

export function FormButton({
  variant = 'primary',
  className,
  children,
  ...props
}: FormButtonProps) {
  return (
    <Button
      {...props}
      variant={variantMap[variant]}
      className={cn('form-heroui-btn', className)}
    >
      {children}
    </Button>
  );
}
