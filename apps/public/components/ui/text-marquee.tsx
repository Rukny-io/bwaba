'use client';

import React, { Children, useId } from 'react';
import { cn } from '@/lib/utils';

type TextMarqueeProps = {
  children: React.ReactNode;
  height?: number;
  speed?: number;
  prefix?: React.ReactNode;
  className?: string;
  direction?: 'horizontal' | 'vertical';
  gap?: number;
};

export function TextMarquee({
  children,
  height = 40,
  speed = 1,
  prefix,
  className,
  direction = 'horizontal',
  gap = 24,
}: TextMarqueeProps) {
  const id = useId().replace(/:/g, '');
  const childArray = Children.toArray(children);
  const duration = 24 / speed;
  const animName = `tm${id}`;
  const isVertical = direction === 'vertical';

  const keyframes = isVertical
    ? `@keyframes ${animName} { from { transform: translateY(0); } to { transform: translateY(-33.3333%); } }`
    : `@keyframes ${animName} { from { transform: translateX(0); } to { transform: translateX(-33.3333%); } }`;

  return (
    <div
      className={cn(
        'relative overflow-hidden',
        isVertical ? 'w-full' : 'flex w-full items-center'
      )}
      style={{ height: `${height}px` }}
    >
      {prefix ? (
        <div className="relative z-10 flex shrink-0 items-center self-end">
          {prefix}
        </div>
      ) : null}
      <div className={cn('overflow-hidden', isVertical ? 'h-full w-full' : 'min-w-0 flex-1')}>
        <style>{keyframes}</style>
        <div
          className={cn(isVertical ? 'flex flex-col' : 'flex w-max')}
          style={{
            animation: `${animName} ${duration}s linear infinite`,
            willChange: 'transform',
          }}
        >
          {[0, 1, 2].map((trackIndex) => (
            <div
              key={trackIndex}
              aria-hidden={trackIndex > 0 ? true : undefined}
              className={cn(
                'flex shrink-0',
                isVertical ? 'flex-col' : 'items-center gap-6 pe-6',
                className
              )}
              style={isVertical ? { gap: `${gap}px`, paddingBottom: `${gap}px` } : undefined}
            >
              {childArray}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
