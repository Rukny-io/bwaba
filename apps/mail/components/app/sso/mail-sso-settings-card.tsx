"use client";

import { useEffect, useState } from "react";
import {
  Button,
  Description,
  Input,
  Label,
  Switch,
  TextField,
} from "@heroui/react";
import type { MailSsoSettings } from "@/lib/mail-sso-client";
import { MailSsoSelect } from "@/components/app/sso/mail-sso-select";

const TTL_OPTIONS = [
  { value: "24", label: "24 hours" },
  { value: "72", label: "3 days" },
  { value: "168", label: "7 days" },
];

function SettingSwitch({
  label,
  description,
  value,
  disabled,
  onChange,
}: {
  label: string;
  description: string;
  value: boolean;
  disabled?: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <Switch
      isSelected={value}
      isDisabled={disabled}
      className="w-full justify-between"
      onChange={onChange}
    >
      <Switch.Content>
        <Label>{label}</Label>
        <Description>{description}</Description>
      </Switch.Content>
      <Switch.Control>
        <Switch.Thumb />
      </Switch.Control>
    </Switch>
  );
}

export function MailSsoSettingsCard({
  settings,
  canManage,
  saving,
  onSave,
}: {
  settings: MailSsoSettings;
  canManage: boolean;
  saving: boolean;
  onSave: (patch: Partial<MailSsoSettings>) => Promise<void>;
}) {
  const [domainsDraft, setDomainsDraft] = useState(
    settings.allowedEmailDomains.join(", "),
  );

  useEffect(() => {
    setDomainsDraft(settings.allowedEmailDomains.join(", "));
  }, [settings.allowedEmailDomains]);

  const disabled = !canManage || saving;
  const parsedDomains = domainsDraft
    .split(/[\s,]+/)
    .map((d) => d.trim().toLowerCase().replace(/^@/, ""))
    .filter(Boolean);
  const domainsChanged =
    parsedDomains.join(",") !== settings.allowedEmailDomains.join(",");
  const ttlValue = TTL_OPTIONS.some((o) => o.value === String(settings.linkTtlHours))
    ? String(settings.linkTtlHours)
    : null;

  return (
    <div className="flex min-w-0 flex-col gap-5 rounded-2xl bg-[var(--surface)] p-4 md:px-6 md:py-5">
      <div className="min-w-0">
        <h2 className="text-[15px] font-semibold tracking-tight text-[var(--foreground)]">
          Quick sign-in
        </h2>
        <p className="mt-1 text-[13px] leading-5 text-[var(--muted-foreground)]">
          Teammates get a one-click link that signs them in, joins this
          workspace and opens their mailbox.
        </p>
      </div>

      <SettingSwitch
        label="Quick sign-in links"
        description="Allow one-click links for new and existing teammates. Turning this off revokes unused links."
        value={settings.quickLinkEnabled}
        disabled={disabled}
        onChange={(value) => void onSave({ quickLinkEnabled: value })}
      />
      <SettingSwitch
        label="Join automatically"
        description="Accept the team invite as soon as the link is opened. Off: the teammate confirms first."
        value={settings.autoAcceptOnLink}
        disabled={disabled}
        onChange={(value) => void onSave({ autoAcceptOnLink: value })}
      />
      <SettingSwitch
        label="Open assigned mailbox without password"
        description="Assignees use their Rukny session instead of the mailbox password. Owners and admins are not affected."
        value={settings.skipMailboxPasswordForAssigned}
        disabled={disabled}
        onChange={(value) => void onSave({ skipMailboxPasswordForAssigned: value })}
      />

      <div className="grid min-w-0 gap-4 md:grid-cols-[12rem_1fr]">
        <div className="min-w-0">
          <Label className="mb-1.5 block text-[13px] font-medium text-[var(--foreground)]">
            Link expires after
          </Label>
          <MailSsoSelect
            label="Link expiry"
            value={ttlValue}
            placeholder={`${settings.linkTtlHours} hours`}
            options={TTL_OPTIONS}
            disabled={disabled}
            onChange={(value) => void onSave({ linkTtlHours: Number(value) })}
          />
        </div>
        <form
          className="flex min-w-0 items-end gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (domainsChanged) void onSave({ allowedEmailDomains: parsedDomains });
          }}
        >
          <TextField
            fullWidth
            className="min-w-0 flex-1 gap-1.5"
            value={domainsDraft}
            onChange={setDomainsDraft}
            isDisabled={disabled}
          >
            <Label className="text-[13px] font-medium text-[var(--foreground)]">
              Allowed email domains
            </Label>
            <Input
              dir="ltr"
              placeholder="Any domain (e.g. acme.com, acme.io)"
              className="h-11 rounded-xl"
            />
          </TextField>
          <Button
            type="submit"
            className="h-11 shrink-0 rounded-full px-4"
            variant="secondary"
            isDisabled={disabled || !domainsChanged}
          >
            Save
          </Button>
        </form>
      </div>
    </div>
  );
}
