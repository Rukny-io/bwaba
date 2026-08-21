"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  TextField,
  Label,
  Input,
  Button,
  Spinner,
  InputOTP,
  cn,
} from "@heroui/react";
import {
  Sparkles,
  LogOut,
  ArrowRight,
  ArrowLeft,
  Check,
  Building2,
  Users,
  Package,
  ShieldCheck,
  Phone,
} from "lucide-react";
import {
  createMailApp,
  sendMailAppOtp,
  verifyMailAppOtp,
  type MailAppType,
} from "@/lib/mail-apps-client";
import { logoutAndRedirect } from "@/lib/logout";

type Step = 1 | 2 | 3 | 4;

interface WizardData {
  name: string;
  contactEmail: string;
  appType: MailAppType;
  phoneNumber: string;
  otpCode: string;
}

const LABELS = {
  welcome: "Welcome to Rukny Mail",
  welcomeDesc: "Register your first Mail app to connect a domain and mailboxes.",
  step1Title: "App details",
  step1Desc: "Basic information about your Mail app.",
  step2Title: "Use cases",
  step2Desc: "Define how your Mail app will be used.",
  step3Title: "App category",
  step3Desc: "Select a category. This cannot be changed later.",
  step4Title: "Verification",
  step4Desc: "Verify your phone number to complete Mail app activation.",
  appName: "Application name",
  appNamePlaceholder: "Acme Mail",
  appNameHint:
    "This name appears in the App Center and is linked to your app ID. You can change it later.",
  contactEmail: "Official contact email",
  contactEmailPlaceholder: "mail@company.com",
  contactEmailHint:
    "We use this email for policy notices or recovery if your app is compromised.",
  useCaseOther: "General mail workspace",
  useCaseOtherDesc:
    "Your app is created with the standard experience for connecting a domain and managing mailboxes.",
  moreUseCasesSoon: "More use cases coming soon.",
  typeBusiness: "Business",
  typeBusinessDesc: "Manage organization mail and domains with business-oriented permissions.",
  typeConsumer: "Consumer",
  typeConsumerDesc: "A mail workspace for personal use or small teams.",
  typeCannotChange: "App category cannot be changed after creation.",
  phoneLabel: "Phone number",
  phonePlaceholder: "9647701234567",
  phoneHint: "Enter your number with country code. A one-time verification code will be sent.",
  sendOtp: "Send verification code",
  sending: "Sending…",
  otpSentTo: "Code sent to",
  resend: "Resend code",
  resendCooldown: "Resend ({seconds}s)",
  verified: "Verified",
  next: "Next",
  back: "Back",
  create: "Activate application",
  creating: "Activating…",
  backToApps: "App Center",
  logout: "Sign out",
  toastOtpSendFailed: "Could not send verification code",
  toastOtpInvalid: "Invalid verification code",
  toastCreateFailed: "Could not activate application",
} as const;

function StepIndicator({ currentStep }: { currentStep: Step }) {
  const steps = [
    { num: 1 as const, label: LABELS.step1Title },
    { num: 2 as const, label: LABELS.step2Title },
    { num: 3 as const, label: LABELS.step3Title },
    { num: 4 as const, label: LABELS.step4Title },
  ];

  return (
    <div className="flex items-center justify-center gap-2">
      {steps.map((step, i) => (
        <div key={step.num} className="flex items-center gap-2">
          <div
            className={cn(
              "flex size-7 items-center justify-center rounded-full text-[11px] font-bold transition-all duration-300",
              step.num < currentStep
                ? "bg-[var(--success)] text-[var(--success-foreground)]"
                : step.num === currentStep
                  ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                  : "bg-[var(--surface-secondary)] text-[var(--muted-foreground)]",
            )}
          >
            {step.num < currentStep ? <Check className="size-3.5" /> : step.num}
          </div>
          {i < steps.length - 1 && (
            <div
              className={cn(
                "h-px w-6 transition-colors duration-300 sm:w-10",
                step.num < currentStep ? "bg-[var(--success)]" : "bg-[var(--border)]",
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function Step1AppDetails({
  data,
  onChange,
}: {
  data: WizardData;
  onChange: (d: Partial<WizardData>) => void;
}) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-[var(--foreground)]">{LABELS.step1Title}</h2>
        <p className="mt-1 text-xs text-[var(--muted-foreground)]">{LABELS.step1Desc}</p>
      </div>

      <div className="dashboard-card space-y-4 rounded-2xl p-5">
        <TextField isRequired>
          <Label className="text-xs font-medium text-[var(--foreground)]">
            {LABELS.appName}
          </Label>
          <Input
            placeholder={LABELS.appNamePlaceholder}
            value={data.name}
            onChange={(e) => onChange({ name: e.target.value })}
            className="rounded-xl"
            autoFocus
          />
        </TextField>
        <p className="-mt-2 text-[11px] leading-relaxed text-[var(--muted-foreground)]">
          {LABELS.appNameHint}
        </p>

        <TextField isRequired>
          <Label className="text-xs font-medium text-[var(--foreground)]">
            {LABELS.contactEmail}
          </Label>
          <Input
            type="email"
            placeholder={LABELS.contactEmailPlaceholder}
            value={data.contactEmail}
            onChange={(e) => onChange({ contactEmail: e.target.value })}
            className="rounded-xl"
          />
        </TextField>
        <p className="-mt-2 text-[11px] leading-relaxed text-[var(--muted-foreground)]">
          {LABELS.contactEmailHint}
        </p>
      </div>
    </div>
  );
}

function Step2UseCases() {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-[var(--foreground)]">{LABELS.step2Title}</h2>
        <p className="mt-1 text-xs text-[var(--muted-foreground)]">{LABELS.step2Desc}</p>
      </div>

      <div className="rounded-2xl border border-[color-mix(in_srgb,var(--primary)_30%,var(--border))] bg-[color-mix(in_srgb,var(--primary)_6%,var(--background))] p-5">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--primary)_12%,var(--background))]">
            <Package className="size-5 text-[var(--primary)]" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-[var(--foreground)]">
                {LABELS.useCaseOther}
              </h3>
              <div className="flex size-5 items-center justify-center rounded-full bg-[var(--primary)]">
                <Check className="size-3 text-[var(--primary-foreground)]" />
              </div>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-[var(--muted-foreground)]">
              {LABELS.useCaseOtherDesc}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-[var(--surface-secondary)] px-4 py-3">
        <p className="text-center text-xs text-[var(--muted-foreground)]">
          {LABELS.moreUseCasesSoon}
        </p>
      </div>
    </div>
  );
}

function RadioIndicator({ selected }: { selected: boolean }) {
  return (
    <span
      className={cn(
        "mt-1 flex size-[18px] shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-200",
        selected
          ? "border-[var(--primary)]"
          : "border-[color-mix(in_srgb,var(--foreground)_18%,var(--border))] bg-[var(--background)]",
      )}
      aria-hidden
    >
      <span
        className={cn(
          "size-2 rounded-full bg-[var(--primary)] transition-all duration-200",
          selected ? "scale-100 opacity-100" : "scale-0 opacity-0",
        )}
      />
    </span>
  );
}

function Step3AppType({
  data,
  onChange,
}: {
  data: WizardData;
  onChange: (d: Partial<WizardData>) => void;
}) {
  const types: {
    value: MailAppType;
    icon: typeof Building2;
    title: string;
    desc: string;
  }[] = [
    {
      value: "BUSINESS",
      icon: Building2,
      title: LABELS.typeBusiness,
      desc: LABELS.typeBusinessDesc,
    },
    {
      value: "CONSUMER",
      icon: Users,
      title: LABELS.typeConsumer,
      desc: LABELS.typeConsumerDesc,
    },
  ];

  function handleKeyDown(event: React.KeyboardEvent, current: MailAppType) {
    if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
    event.preventDefault();
    onChange({
      appType: current === "BUSINESS" ? "CONSUMER" : "BUSINESS",
    });
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-[var(--foreground)]">{LABELS.step3Title}</h2>
        <p className="mt-1 text-xs text-[var(--muted-foreground)]">{LABELS.step3Desc}</p>
      </div>

      <div role="radiogroup" aria-label={LABELS.step3Title} className="space-y-2.5">
        {types.map((type) => {
          const Icon = type.icon;
          const selected = data.appType === type.value;
          return (
            <button
              key={type.value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange({ appType: type.value })}
              onKeyDown={(e) => handleKeyDown(e, type.value)}
              className={cn(
                "group flex w-full items-start gap-3.5 rounded-2xl border p-4 text-start transition-all duration-200",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/35 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]",
                selected
                  ? "border-[color-mix(in_srgb,var(--primary)_45%,var(--border))] bg-[color-mix(in_srgb,var(--primary)_7%,var(--background))] shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--primary)_12%,transparent)]"
                  : "border-[var(--border)] bg-[var(--background)] hover:border-[color-mix(in_srgb,var(--primary)_22%,var(--border))] hover:bg-[var(--surface-secondary)]",
              )}
            >
              <RadioIndicator selected={selected} />

              <div className="flex min-w-0 flex-1 items-start gap-3">
                <div
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-xl transition-colors duration-200",
                    selected
                      ? "bg-[color-mix(in_srgb,var(--primary)_14%,var(--background))]"
                      : "bg-[var(--surface-secondary)] group-hover:bg-[color-mix(in_srgb,var(--primary)_8%,var(--surface-secondary))]",
                  )}
                >
                  <Icon
                    className={cn(
                      "size-5 transition-colors duration-200",
                      selected ? "text-[var(--primary)]" : "text-[var(--muted-foreground)]",
                    )}
                  />
                </div>

                <div className="min-w-0 flex-1 pt-0.5">
                  <h3
                    className={cn(
                      "text-sm font-semibold transition-colors duration-200",
                      selected ? "text-[var(--primary)]" : "text-[var(--foreground)]",
                    )}
                  >
                    {type.title}
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-[var(--muted-foreground)]">
                    {type.desc}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <p className="text-center text-[11px] text-[var(--muted-foreground)]">
        {LABELS.typeCannotChange}
      </p>
    </div>
  );
}

function Step4Verification({
  data,
  onChange,
  onSendOtp,
  onVerifyOtp,
  isSending,
  isVerifying,
  otpSent,
  otpVerified,
  otpError,
  cooldown,
}: {
  data: WizardData;
  onChange: (d: Partial<WizardData>) => void;
  onSendOtp: () => void;
  onVerifyOtp: (code?: string) => void;
  isSending: boolean;
  isVerifying: boolean;
  otpSent: boolean;
  otpVerified: boolean;
  otpError: string;
  cooldown: number;
}) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-[var(--foreground)]">{LABELS.step4Title}</h2>
        <p className="mt-1 text-xs text-[var(--muted-foreground)]">{LABELS.step4Desc}</p>
      </div>

      <div className="dashboard-card space-y-4 rounded-2xl p-5">
        <TextField isRequired>
          <Label className="text-xs font-medium text-[var(--foreground)]">
            {LABELS.phoneLabel}
          </Label>
          <Input
            type="tel"
            placeholder={LABELS.phonePlaceholder}
            value={data.phoneNumber}
            onChange={(e) => onChange({ phoneNumber: e.target.value.replace(/\D/g, "") })}
            className="rounded-xl"
            dir="ltr"
            disabled={otpVerified}
          />
        </TextField>
        <p className="-mt-2 text-[11px] leading-relaxed text-[var(--muted-foreground)]">
          {LABELS.phoneHint}
        </p>

        {!otpSent && !otpVerified ? (
          <Button
            type="button"
            className="h-10 w-full rounded-xl bg-[var(--primary)] font-medium text-[var(--primary-foreground)]"
            isDisabled={!data.phoneNumber || data.phoneNumber.length < 10 || isSending}
            onPress={onSendOtp}
          >
            {isSending ? (
              <span className="flex items-center gap-2">
                <Spinner size="sm" />
                {LABELS.sending}
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Phone className="size-4" />
                {LABELS.sendOtp}
              </span>
            )}
          </Button>
        ) : null}

        {otpSent && !otpVerified ? (
          <div className="space-y-4 pt-2">
            <div className="h-px bg-[var(--border)]" />

            <p className="text-center text-xs font-medium text-[var(--foreground)]">
              {LABELS.otpSentTo}{" "}
              <span dir="ltr" className="font-mono">
                {data.phoneNumber}
              </span>
            </p>

            <div className="flex justify-center" dir="ltr">
              <InputOTP
                maxLength={6}
                value={data.otpCode}
                onChange={(val: string) => onChange({ otpCode: val })}
                onComplete={(code) => {
                  onChange({ otpCode: code });
                  onVerifyOtp(code);
                }}
              >
                <InputOTP.Group>
                  <InputOTP.Slot index={0} />
                  <InputOTP.Slot index={1} />
                  <InputOTP.Slot index={2} />
                </InputOTP.Group>
                <InputOTP.Separator />
                <InputOTP.Group>
                  <InputOTP.Slot index={3} />
                  <InputOTP.Slot index={4} />
                  <InputOTP.Slot index={5} />
                </InputOTP.Group>
              </InputOTP>
            </div>

            {isVerifying ? (
              <div className="flex justify-center">
                <Spinner size="sm" />
              </div>
            ) : null}

            {otpError ? (
              <p className="text-center text-xs text-[var(--danger)]">{otpError}</p>
            ) : null}

            <button
              type="button"
              onClick={onSendOtp}
              disabled={cooldown > 0 || isSending}
              className="w-full text-center text-xs text-[var(--primary)] hover:underline disabled:text-[var(--muted-foreground)] disabled:no-underline"
            >
              {cooldown > 0
                ? LABELS.resendCooldown.replace("{seconds}", String(cooldown))
                : LABELS.resend}
            </button>
          </div>
        ) : null}

        {otpVerified ? (
          <div className="flex items-center justify-center gap-2 py-3">
            <div className="flex size-8 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--success)_15%,var(--background))]">
              <ShieldCheck className="size-4 text-[var(--success)]" />
            </div>
            <p className="text-sm font-medium text-[var(--success)]">{LABELS.verified}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function MailFirstAppSetup({ defaultEmail = "" }: { defaultEmail?: string }) {
  const [step, setStep] = useState<Step>(1);
  const [data, setData] = useState<WizardData>({
    name: "",
    contactEmail: defaultEmail,
    appType: "BUSINESS",
    phoneNumber: "",
    otpCode: "",
  });
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [createError, setCreateError] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const updateData = useCallback(
    (partial: Partial<WizardData>) => setData((prev) => ({ ...prev, ...partial })),
    [],
  );

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const isStep1Valid =
    data.name.trim().length >= 2 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.contactEmail);
  const isStep2Valid = true;
  const isStep3Valid = Boolean(data.appType);
  const isStep4Valid = otpVerified;

  const canProceed = [isStep1Valid, isStep2Valid, isStep3Valid, isStep4Valid][step - 1];

  const handleNext = () => {
    if (step < 4) setStep((s) => (s + 1) as Step);
  };

  const handleBack = () => {
    if (step > 1) setStep((s) => (s - 1) as Step);
  };

  const handleSendOtp = async () => {
    setOtpError("");
    setIsSending(true);
    try {
      await sendMailAppOtp({ phoneNumber: data.phoneNumber });
      setOtpSent(true);
      setCooldown(60);
    } catch (err: unknown) {
      setOtpError(err instanceof Error ? err.message : LABELS.toastOtpSendFailed);
    } finally {
      setIsSending(false);
    }
  };

  const handleVerifyOtp = async (codeOverride?: string) => {
    const code = (codeOverride ?? data.otpCode).trim();
    if (code.length < 6) return;

    setOtpError("");
    setIsVerifying(true);
    try {
      await verifyMailAppOtp({
        phoneNumber: data.phoneNumber,
        code,
      });
      updateData({ otpCode: code });
      setOtpVerified(true);
    } catch (err: unknown) {
      setOtpError(err instanceof Error ? err.message : LABELS.toastOtpInvalid);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCreate = async () => {
    setCreateError("");
    setIsCreating(true);
    try {
      const app = await createMailApp({
        name: data.name.trim(),
        contactEmail: data.contactEmail.trim(),
        appType: data.appType,
        otpCode: data.otpCode,
      });
      window.location.assign(`/apps/${app.appId}/open`);
    } catch (err: unknown) {
      setCreateError(err instanceof Error ? err.message : LABELS.toastCreateFailed);
      setIsCreating(false);
    }
  };

  return (
    <div className="flex min-h-dvh" dir="ltr">
      <div className="flex flex-1 items-center justify-center p-4">
        <div className="w-full max-w-lg space-y-6">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex items-center gap-2.5">
              <Image src="/rukny-logo.svg" alt="Rukny" width={32} height={32} priority />
              <span className="text-lg font-bold text-[var(--foreground)]">Rukny</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-[var(--foreground)]">{LABELS.welcome}</h1>
              <p className="mt-1 text-xs text-[var(--muted-foreground)]">{LABELS.welcomeDesc}</p>
            </div>
          </div>

          <StepIndicator currentStep={step} />

          <div className="min-h-[280px]">
            {step === 1 ? <Step1AppDetails data={data} onChange={updateData} /> : null}
            {step === 2 ? <Step2UseCases /> : null}
            {step === 3 ? <Step3AppType data={data} onChange={updateData} /> : null}
            {step === 4 ? (
              <Step4Verification
                data={data}
                onChange={updateData}
                onSendOtp={() => void handleSendOtp()}
                onVerifyOtp={(code) => void handleVerifyOtp(code)}
                isSending={isSending}
                isVerifying={isVerifying}
                otpSent={otpSent}
                otpVerified={otpVerified}
                otpError={otpError}
                cooldown={cooldown}
              />
            ) : null}
          </div>

          {createError ? (
            <p className="text-center text-xs text-[var(--danger)]">{createError}</p>
          ) : null}

          <div className="flex items-center gap-3">
            {step > 1 ? (
              <Button
                type="button"
                variant="outline"
                className="h-11 flex-1 rounded-xl font-medium"
                onPress={handleBack}
              >
                <ArrowLeft className="size-4" />
                {LABELS.back}
              </Button>
            ) : null}

            {step < 4 ? (
              <Button
                type="button"
                className={cn(
                  "h-11 rounded-xl bg-[var(--primary)] font-medium text-[var(--primary-foreground)]",
                  step === 1 ? "w-full" : "flex-1",
                )}
                isDisabled={!canProceed}
                onPress={handleNext}
              >
                {LABELS.next}
                <ArrowRight className="size-4" />
              </Button>
            ) : (
              <Button
                type="button"
                className="h-11 flex-1 rounded-xl bg-[var(--primary)] font-medium text-[var(--primary-foreground)]"
                isDisabled={!otpVerified || isCreating}
                onPress={() => void handleCreate()}
              >
                {isCreating ? (
                  <span className="flex items-center gap-2">
                    <Spinner size="sm" />
                    {LABELS.creating}
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Sparkles className="size-4" />
                    {LABELS.create}
                  </span>
                )}
              </Button>
            )}
          </div>

          <div className="flex flex-col items-center gap-3">
            <Link
              href="/apps"
              className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            >
              {LABELS.backToApps}
            </Link>
            <button
              type="button"
              onClick={() => void logoutAndRedirect()}
              className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
            >
              <LogOut className="size-3" />
              {LABELS.logout}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
