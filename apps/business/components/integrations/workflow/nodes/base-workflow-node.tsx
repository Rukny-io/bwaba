'use client';

import type { ReactNode } from 'react';
import { Handle, Position } from '@xyflow/react';
import { cn } from '@/lib/utils';

const handleClass =
  '!size-2.5 !border-2 !border-[var(--surface)] !bg-[var(--foreground)]';

export function BaseWorkflowNode({
  title,
  subtitle,
  icon,
  selected,
  accentClass = 'text-[var(--foreground)]',
  children,
  showTarget = true,
  outputs = [{ id: 'out', label: 'out' }],
}: {
  title: string;
  subtitle?: string;
  icon: ReactNode;
  selected?: boolean;
  accentClass?: string;
  children?: ReactNode;
  showTarget?: boolean;
  outputs?: { id: string; label?: string }[];
}) {
  return (
    <div
      className={cn(
        'min-w-[210px] max-w-[260px] overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--card-shadow)] transition-shadow',
        selected && 'ring-2 ring-[var(--primary)] ring-offset-2 ring-offset-[var(--background)]',
      )}
    >
      {showTarget ? (
        <Handle
          type="target"
          position={Position.Top}
          id="in"
          className={handleClass}
        />
      ) : null}

      <div className="flex items-center gap-2 border-b border-[var(--border)] px-3 py-2.5">
        <span
          className={cn(
            'flex size-7 shrink-0 items-center justify-center rounded-xl bg-[var(--surface-secondary)]',
            accentClass,
          )}
        >
          {icon}
        </span>
        <div className="min-w-0">
          <p className="truncate text-[12px] font-semibold text-[var(--foreground)]">{title}</p>
          {subtitle ? (
            <p className="truncate text-[10px] text-[var(--muted-foreground)]">{subtitle}</p>
          ) : null}
        </div>
      </div>

      {children ? (
        <div className="px-3 py-2 text-[11px] leading-relaxed text-[var(--muted-foreground)]">
          {children}
        </div>
      ) : null}

      {outputs.map((output, index) => (
        <Handle
          key={output.id}
          type="source"
          position={Position.Bottom}
          id={output.id}
          className={handleClass}
          style={{
            left:
              outputs.length === 1
                ? '50%'
                : `${((index + 1) / (outputs.length + 1)) * 100}%`,
          }}
        />
      ))}
    </div>
  );
}
