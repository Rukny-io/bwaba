import Link from 'next/link';
import { Button } from '@heroui/react';
import { Pencil } from 'lucide-react';
import { getFormCreatingPath } from '@/lib/forms-paths';
import { cn } from '@/lib/utils';

export function OpenFormEditorButton({
  formSlug,
  size = 'sm',
  variant = 'primary',
  className,
  fullWidth = false,
}: {
  formSlug: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'tertiary' | 'outline';
  className?: string;
  fullWidth?: boolean;
}) {
  return (
    <Link href={getFormCreatingPath(formSlug)} className={fullWidth ? 'block w-full' : undefined}>
      <Button
        size={size}
        variant={variant}
        className={cn('rounded-xl', fullWidth && 'w-full', className)}
      >
        <Pencil className="size-4" aria-hidden />
        افتح المحرّر
      </Button>
    </Link>
  );
}
