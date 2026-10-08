"use client";

import { ChevronDown } from "lucide-react";
import { Description, Dropdown, Label } from "@heroui/react";

export type MailSsoSelectOption<T extends string> = {
  value: T;
  label: string;
  hint?: string;
  disabled?: boolean;
};

export function MailSsoSelect<T extends string>({
  label,
  value,
  options,
  onChange,
  disabled,
  placeholder = "Select",
}: {
  label: string;
  value: T | null;
  options: MailSsoSelectOption<T>[];
  onChange: (value: T) => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  const selected = options.find((opt) => opt.value === value);
  return (
    <Dropdown>
      <Dropdown.Trigger
        aria-label={label}
        isDisabled={disabled}
        className="inline-flex h-11 w-full min-w-0 items-center justify-between gap-2 rounded-xl bg-[var(--field-background)] px-3.5 text-start text-sm font-medium text-[var(--foreground)] outline-none transition-colors hover:bg-[color-mix(in_srgb,var(--foreground)_4%,var(--field-background))] disabled:opacity-50"
      >
        <span className="min-w-0 truncate" dir="auto">
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown className="size-3.5 shrink-0 text-[var(--muted-foreground)]" />
      </Dropdown.Trigger>
      <Dropdown.Popover
        placement="bottom start"
        className="max-h-80 min-w-[15rem] overflow-y-auto rounded-2xl"
      >
        <Dropdown.Menu
          selectedKeys={value ? new Set([value]) : new Set()}
          selectionMode="single"
          onSelectionChange={(keys) => {
            if (keys === "all") return;
            const next = [...keys][0];
            if (next != null) onChange(String(next) as T);
          }}
        >
          <Dropdown.Section>
            {options.map((opt) => (
              <Dropdown.Item
                key={opt.value}
                id={opt.value}
                textValue={opt.label}
                isDisabled={opt.disabled}
              >
                <Dropdown.ItemIndicator />
                <div className="flex min-w-0 flex-col gap-0.5 py-0.5">
                  <Label className="leading-5" dir="auto">
                    {opt.label}
                  </Label>
                  {opt.hint ? (
                    <Description className="leading-4">{opt.hint}</Description>
                  ) : null}
                </div>
              </Dropdown.Item>
            ))}
          </Dropdown.Section>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}

export const MAIL_SSO_ROLE_OPTIONS: MailSsoSelectOption<
  "ADMIN" | "BILLING" | "MEMBER" | "VIEWER"
>[] = [
  { value: "MEMBER", label: "Member", hint: "Mailboxes (not team or domain)" },
  { value: "VIEWER", label: "Viewer", hint: "Read-only / assigned mailbox" },
  { value: "ADMIN", label: "Admin", hint: "Team, domain, mailboxes, billing" },
  { value: "BILLING", label: "Billing", hint: "Billing only" },
];

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
