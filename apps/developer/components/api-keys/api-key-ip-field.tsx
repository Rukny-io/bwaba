'use client';

import { Button } from '@heroui/react';
import { isValidIpAddress } from '@/lib/api-key-format';
import { cn } from '@/lib/utils';

interface ApiKeyIpFieldProps {
  ipInput: string;
  ipList: string[];
  ipError: string | null;
  placeholder: string;
  addLabel: string;
  removeIpLabel: string;
  onInputChange: (value: string) => void;
  onAdd: () => void;
  onRemove: (ip: string) => void;
}

export function ApiKeyIpField({
  ipInput,
  ipList,
  ipError,
  placeholder,
  addLabel,
  removeIpLabel,
  onInputChange,
  onAdd,
  onRemove,
}: ApiKeyIpFieldProps) {
  return (
    <div>
      <div className="mt-2 flex gap-2">
        <input
          type="text"
          dir="ltr"
          value={ipInput}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              onAdd();
            }
          }}
          placeholder={placeholder}
          aria-invalid={Boolean(ipError)}
          className={cn(
            'h-10 flex-1 rounded-xl border bg-[var(--background)] px-3 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2',
            ipError
              ? 'border-[var(--danger)] focus:border-[var(--danger)] focus:ring-[color-mix(in_srgb,var(--danger)_20%,transparent)]'
              : 'border-[var(--border)] focus:border-[var(--primary)] focus:ring-[color-mix(in_srgb,var(--primary)_20%,transparent)]',
          )}
        />
        <Button variant="secondary" onPress={onAdd} className="rounded-xl">
          {addLabel}
        </Button>
      </div>
      {ipError ? (
        <p className="mt-1.5 text-xs text-[var(--danger)]">{ipError}</p>
      ) : null}
      {ipList.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {ipList.map((ip) => (
            <span
              key={ip}
              className="inline-flex items-center gap-1 rounded-full bg-[var(--surface-secondary)] px-2.5 py-1 font-mono text-xs"
            >
              {ip}
              <button
                type="button"
                onClick={() => onRemove(ip)}
                className="text-[var(--muted-foreground)] hover:text-[var(--danger)]"
                aria-label={removeIpLabel}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function validateIpEntry(
  value: string,
  existing: string[],
  labels: { invalid: string; duplicate: string },
): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!isValidIpAddress(trimmed)) return labels.invalid;
  if (existing.includes(trimmed)) return labels.duplicate;
  return null;
}
