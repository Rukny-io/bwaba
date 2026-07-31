'use client';

import type { ReactNode } from 'react';
import { Tooltip } from '@heroui/react';

interface TableHintProps {
  content: string;
  children: ReactNode;
  ariaLabel?: string;
}

export function TableHint({ content, children, ariaLabel }: TableHintProps) {
  return (
    <Tooltip delay={350}>
      <Tooltip.Trigger aria-label={ariaLabel ?? content}>
        <span className="inline-flex cursor-default items-center">{children}</span>
      </Tooltip.Trigger>
      <Tooltip.Content showArrow className="max-w-[15rem] px-2.5 py-1.5 text-center text-xs">
        <Tooltip.Arrow />
        {content}
      </Tooltip.Content>
    </Tooltip>
  );
}
