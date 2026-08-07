import Link from 'next/link';
import { ArrowLeft, type LucideIcon } from 'lucide-react';
import { Card, Typography } from '@heroui/react';
import { cn } from '@/lib/utils';

interface DashboardQuickActionProps {
  href: string;
  icon: LucideIcon;
  title: string;
  description: string;
  className?: string;
}

export function DashboardQuickAction({
  href,
  icon: Icon,
  title,
  description,
  className,
}: DashboardQuickActionProps) {
  return (
    <Link href={href} className={cn('block', className)}>
      <Card className="group flex items-center gap-4 p-4 transition-colors hover:bg-surface-secondary sm:p-5">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-surface-secondary text-primary">
          <Icon size={18} strokeWidth={1.8} />
        </div>
        <div className="min-w-0 flex-1">
          <Typography.Paragraph size="sm" weight="semibold">
            {title}
          </Typography.Paragraph>
          <Typography.Paragraph size="xs" color="muted" className="mt-0.5">
            {description}
          </Typography.Paragraph>
        </div>
        <ArrowLeft
          size={16}
          className="shrink-0 text-muted-foreground transition-transform group-hover:-translate-x-0.5"
        />
      </Card>
    </Link>
  );
}
