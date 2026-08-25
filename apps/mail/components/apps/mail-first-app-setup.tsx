"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Button,
  Input,
  InputOTP,
  Label,
  Spinner,
  TextField,
  cn,
} from "@heroui/react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Globe,
  LogOut,
  Mail,
  Phone,
  ShieldCheck,
} from "lucide-react";
import {
  createMailApp,
  sendMailAppOtp,
  verifyMailAppOtp,
} from "@/lib/mail-apps-client";
import { logoutAndRedirect } from "@/lib/logout";
import { normalizeDomain, validateDomain } from "@/lib/mail-domain";
import { writePendingMailbox } from "@/lib/mail-pending-mailbox";

type Step = 1 | 2 | 3;

type WizardData = {
  domain: string;
  contactEmail: string;
  localPart: string;
  displayName: string;
  password: string;
  passwordConfirm: string;
  phoneNumber: string;
  otpCode: string;
};

const LOCAL_PART_PATTERN = /^[a-z0-9](?:[a-z0-9._-]{0,62}[a-z0-9])?$/;
const GENERIC_FROM_NAMES = new Set([
  "support",
  "admin",
  "security",
  "help",
  "helpdesk",
  "info",
  "contact",
  "noreply",
  "no-reply",
]);

function isGenericFromName(value: string) {
  return GENERIC_FROM_NAMES.has(value.trim().toLowerCase());
}

const COPY = {
  welcome: "Start Rukny Mail",
  welcomeDesc: "Your domain, first mailbox, then a phone check.",
  step1Title: "Domain",
  step1Desc: "A domain you registered — yourbrand.com — never rukny.io.",
  step2Title: "Mailbox",
  step2Desc: "Choose the address and the name people will see.",
  step3Title: "Verify",
  step3Desc: "Confirm the phone on this Rukny account.",
  domain: "Your domain",
  domainPlaceholder: "example.com",
  contactEmail: "Recovery email",
  localPart: "Mailbox address",
  displayName: "From name",
  displayNameHint: "Your name or company. Avoid Support or Admin — Gmail treats those as spam.",
  password: "Mailbox password",
  passwordConfirm: "Confirm password",
  phoneLabel: "Phone number",
  phonePlaceholder: "9647701234567",
  sendOtp: "Send code",
  sending: "Sending…",
  resend: "Resend code",
  resendWait: "Resend in {seconds}s",
  verified: "Verified",
  next: "Continue",
  back: "Back",
  create: "Create workspace",
  creating: "Creating…",
  backToList: "Workspaces",
  logout: "Sign out",
} as const;

function StepIndicator({ current }: { current: Step }) {
  const steps = [
    { num: 1 as const, label: COPY.step1Title },
    { num: 2 as const, label: COPY.step2Title },
    { num: 3 as const, label: COPY.step3Title },
  ];
  return (
    <div className="flex items-center justify-center gap-2">
      {steps.map((step, index) => (
        <div key={step.num} className="flex items-center gap-2">
          <div
            className={cn(
              "flex size-7 items-center justify-center rounded-full text-[11px] font-bold",
              step.num < current
                ? "bg-[var(--success)] text-[var(--success-foreground)]"
                : step.num === current
                  ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                  : "bg-[var(--surface-secondary)] text-[var(--muted-foreground)]",
            )}
          >
            {step.num < current ? <Check className="size-3.5" /> : step.num}
          </div>
          <span className="hidden text-[11px] font-medium text-[var(--muted-foreground)] sm:inline">
            {step.label}
          </span>
          {index < steps.length - 1 ? (
            <div className={cn("h-px w-6 sm:w-10", step.num < current ? "bg-[var(--success)]" : "bg-[var(--border)]")} />
          ) : null}
        </div>
      ))}
    </div>
  );
}

export function MailFirstAppSetup({ defaultEmail = "" }: { defaultEmail?: string }) {
  const [step, setStep] = useState<Step>(1);
  const [data, setData] = useState<WizardData>({
    domain: "",
    contactEmail: defaultEmail,
    localPart: "",
    displayName: "",
    password: "",
    passwordConfirm: "",
    phoneNumber: "",
    otpCode: "",
  });
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [formError, setFormError] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [creating, setCreating] = useState(false);

  const update = useCallback((partial: Partial<WizardData>) => {
    setData((prev) => ({ ...prev, ...partial }));
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const domain = useMemo(() => normalizeDomain(data.domain), [data.domain]);
  const domainError = data.domain.trim() ? validateDomain(domain) : "Enter a domain you own.";
  const localPart = data.localPart.trim().toLowerCase();
  const step1Ok = !domainError && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.contactEmail.trim());
  const step2Ok =
    LOCAL_PART_PATTERN.test(localPart) &&
    data.displayName.trim().length >= 2 &&
    !isGenericFromName(data.displayName) &&
    data.password.length >= 8 &&
    data.password === data.passwordConfirm;
  const canContinue = step === 1 ? step1Ok : step === 2 ? step2Ok : otpVerified;

  async function sendOtp() {
    setOtpError("");
    setSendingOtp(true);
    try {
      await sendMailAppOtp({ phoneNumber: data.phoneNumber });
      setOtpSent(true);
      setCooldown(60);
    } catch (error) {
      setOtpError(error instanceof Error ? error.message : "Could not send the code.");
    } finally {
      setSendingOtp(false);
    }
  }

  async function verifyOtp(codeOverride?: string) {
    const code = (codeOverride ?? data.otpCode).trim();
    if (code.length < 6) return;
    setOtpError("");
    setVerifyingOtp(true);
    try {
      await verifyMailAppOtp({ phoneNumber: data.phoneNumber, code });
      update({ otpCode: code });
      setOtpVerified(true);
    } catch (error) {
      setOtpError(error instanceof Error ? error.message : "Invalid code.");
    } finally {
      setVerifyingOtp(false);
    }
  }

  async function createWorkspace() {
    setFormError("");
    setCreating(true);
    try {
      const app = await createMailApp({
        name: domain,
        contactEmail: data.contactEmail.trim(),
        appType: "BUSINESS",
        otpCode: data.otpCode,
      });
      writePendingMailbox({
        appId: app.appId,
        domain,
        localPart,
        displayName: data.displayName.trim(),
        password: data.password,
      });
      window.location.assign(`/apps/${app.appId}/open`);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Could not create this workspace.");
      setCreating(false);
    }
  }

  return (
    <div className="flex min-h-dvh" dir="ltr">
      <div className="flex flex-1 items-center justify-center p-4">
        <div className="w-full max-w-lg space-y-6">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex items-center gap-2.5">
              <Image src="/rukny-logo.svg" alt="Rukny" width={32} height={32} priority />
              <span className="text-lg font-bold text-[var(--foreground)]">Rukny Mail</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-[var(--foreground)]">{COPY.welcome}</h1>
              <p className="mt-1 text-xs text-[var(--muted-foreground)]">{COPY.welcomeDesc}</p>
            </div>
          </div>

          <StepIndicator current={step} />

          {step === 1 ? (
            <div className="space-y-4 rounded-2xl bg-[var(--background)] p-5">
              <div className="flex items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--primary)_12%,var(--background))]">
                  <Globe className="size-5 text-[var(--primary)]" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold">{COPY.step1Title}</h2>
                  <p className="mt-1 text-xs text-[var(--muted-foreground)]">{COPY.step1Desc}</p>
                </div>
              </div>
              <TextField isRequired>
                <Label>{COPY.domain}</Label>
                <Input
                  value={data.domain}
                  onChange={(event) => update({ domain: event.target.value })}
                  placeholder={COPY.domainPlaceholder}
                  autoFocus
                />
              </TextField>
              {data.domain.trim() && domainError ? (
                <p className="text-xs text-[var(--danger)]">{domainError}</p>
              ) : null}
              <TextField isRequired>
                <Label>{COPY.contactEmail}</Label>
                <Input
                  type="email"
                  value={data.contactEmail}
                  onChange={(event) => update({ contactEmail: event.target.value })}
                />
              </TextField>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-4 rounded-2xl bg-[var(--background)] p-5">
              <div className="flex items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--primary)_12%,var(--background))]">
                  <Mail className="size-5 text-[var(--primary)]" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold">{COPY.step2Title}</h2>
                  <p className="mt-1 text-xs text-[var(--muted-foreground)]">{COPY.step2Desc}</p>
                </div>
              </div>
              <TextField isRequired>
                <Label>{COPY.localPart}</Label>
                <Input
                  value={data.localPart}
                  onChange={(event) => update({ localPart: event.target.value.toLowerCase() })}
                  placeholder="hello"
                />
              </TextField>
              <p className="text-xs text-[var(--muted-foreground)]">
                {localPart || "hello"}@{domain || "example.com"}
              </p>
              <TextField isRequired>
                <Label>{COPY.displayName}</Label>
                <Input
                  value={data.displayName}
                  onChange={(event) => update({ displayName: event.target.value })}
                  placeholder="Rukny Studio"
                />
              </TextField>
              <p className="text-xs text-[var(--muted-foreground)]">{COPY.displayNameHint}</p>
              {isGenericFromName(data.displayName) ? (
                <p className="text-xs text-[var(--danger)]">
                  Choose a real name or company. “Support” is a common spam signal.
                </p>
              ) : null}
              <div className="grid gap-3 sm:grid-cols-2">
                <TextField isRequired>
                  <Label>{COPY.password}</Label>
                  <Input
                    type="password"
                    value={data.password}
                    onChange={(event) => update({ password: event.target.value })}
                    minLength={8}
                    autoComplete="new-password"
                  />
                </TextField>
                <TextField isRequired>
                  <Label>{COPY.passwordConfirm}</Label>
                  <Input
                    type="password"
                    value={data.passwordConfirm}
                    onChange={(event) => update({ passwordConfirm: event.target.value })}
                    minLength={8}
                    autoComplete="new-password"
                  />
                </TextField>
              </div>
              {data.passwordConfirm && data.password !== data.passwordConfirm ? (
                <p className="text-xs text-[var(--danger)]">Passwords do not match.</p>
              ) : null}
            </div>
          ) : null}

          {step === 3 ? (
            <div className="space-y-4 rounded-2xl bg-[var(--background)] p-5">
              <div className="flex items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--primary)_12%,var(--background))]">
                  <Phone className="size-5 text-[var(--primary)]" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold">{COPY.step3Title}</h2>
                  <p className="mt-1 text-xs text-[var(--muted-foreground)]">{COPY.step3Desc}</p>
                </div>
              </div>
              <TextField isRequired>
                <Label>{COPY.phoneLabel}</Label>
                <Input
                  inputMode="numeric"
                  value={data.phoneNumber}
                  onChange={(event) => {
                    update({ phoneNumber: event.target.value.replace(/\D/g, "") });
                    setOtpVerified(false);
                    setOtpSent(false);
                  }}
                  placeholder={COPY.phonePlaceholder}
                />
              </TextField>
              {!otpSent ? (
                <Button
                  type="button"
                  className="h-10 w-full rounded-xl"
                  isDisabled={data.phoneNumber.length < 10 || sendingOtp}
                  onPress={() => void sendOtp()}
                >
                  {sendingOtp ? COPY.sending : COPY.sendOtp}
                </Button>
              ) : (
                <div className="space-y-3">
                  <InputOTP
                    maxLength={6}
                    value={data.otpCode}
                    onChange={(value) => {
                      update({ otpCode: value });
                      if (value.length === 6) void verifyOtp(value);
                    }}
                  >
                    <InputOTP.Group>
                      {Array.from({ length: 6 }).map((_, index) => (
                        <InputOTP.Slot key={index} index={index} />
                      ))}
                    </InputOTP.Group>
                  </InputOTP>
                  {otpVerified ? (
                    <p className="flex items-center justify-center gap-2 text-sm text-[var(--success)]">
                      <ShieldCheck className="size-4" />
                      {COPY.verified}
                    </p>
                  ) : (
                    <button
                      type="button"
                      disabled={cooldown > 0 || sendingOtp}
                      onClick={() => void sendOtp()}
                      className="w-full text-center text-xs text-[var(--muted-foreground)]"
                    >
                      {cooldown > 0 ? COPY.resendWait.replace("{seconds}", String(cooldown)) : COPY.resend}
                    </button>
                  )}
                </div>
              )}
              {otpError ? <p className="text-xs text-[var(--danger)]">{otpError}</p> : null}
              {verifyingOtp ? <p className="text-center text-xs text-[var(--muted-foreground)]">Checking code…</p> : null}
            </div>
          ) : null}

          {formError ? <p className="text-center text-xs text-[var(--danger)]">{formError}</p> : null}

          <div className="flex items-center gap-3">
            {step > 1 ? (
              <Button
                type="button"
                variant="outline"
                className="h-11 flex-1 rounded-xl"
                onPress={() => setStep((current) => (current - 1) as Step)}
              >
                <ArrowLeft className="size-4" />
                {COPY.back}
              </Button>
            ) : null}
            {step < 3 ? (
              <Button
                type="button"
                className={cn("h-11 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)]", step === 1 ? "w-full" : "flex-1")}
                isDisabled={!canContinue}
                onPress={() => setStep((current) => (current + 1) as Step)}
              >
                {COPY.next}
                <ArrowRight className="size-4" />
              </Button>
            ) : (
              <Button
                type="button"
                className="h-11 flex-1 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)]"
                isDisabled={!otpVerified || creating}
                onPress={() => void createWorkspace()}
              >
                {creating ? (
                  <span className="flex items-center gap-2">
                    <Spinner size="sm" />
                    {COPY.creating}
                  </span>
                ) : (
                  COPY.create
                )}
              </Button>
            )}
          </div>

          <div className="flex flex-col items-center gap-3">
            <Link href="/apps" className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
              {COPY.backToList}
            </Link>
            <button
              type="button"
              onClick={() => void logoutAndRedirect()}
              className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            >
              <LogOut className="size-3" />
              {COPY.logout}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
