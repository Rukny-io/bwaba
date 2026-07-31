'use client';

import type { CSSProperties, ReactNode } from 'react';
import { cn } from '../utils';

const DEFAULT_WIDTH_PX = 300;
const DEFAULT_HEIGHT = 'calc(100dvh - 7rem)';
const DEFAULT_RADIUS = '2.35rem';

export interface ProfilePreviewFrameProps {
  children: ReactNode;
  width?: number;
  height?: CSSProperties['height'];
  radius?: string;
  className?: string;
}

/** Phone-shaped scroll container for live profile preview — layout only, no theme. */
export function ProfilePreviewFrame({
  children,
  width = DEFAULT_WIDTH_PX,
  height = DEFAULT_HEIGHT,
  radius = DEFAULT_RADIUS,
  className,
}: ProfilePreviewFrameProps) {
  return (
    <div
      className={cn('overflow-hidden bg-[var(--background)]', className)}
      style={{
        width,
        height,
        borderRadius: radius,
      }}
    >
      <div
        className="h-full overscroll-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ overflowY: 'auto', borderRadius: radius }}
      >
        {children}
      </div>
    </div>
  );
}
