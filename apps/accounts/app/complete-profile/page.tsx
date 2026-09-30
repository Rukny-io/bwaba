"use client"

import React, { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useTranslations, useLocale } from "next-intl"
import { ArrowUpRight, Loader2, Store } from "lucide-react"
import { AuthFooter } from "@/components/auth/auth-footer"
import { AuthLoadingFallback } from "@/components/auth/auth-loading"
import { AuthSplitPage } from "@/components/auth/auth-split-page"
import { AuthStatus } from "@/components/auth/auth-status"
import { OnboardingShell } from "@/components/auth/onboarding/onboarding-shell"
import { ProfileInfoForm } from "@/components/auth/onboarding/profile-info-form"
import {
  AccountTypeStep,
  type AccountType,
} from "@/components/auth/onboarding/account-type-step"
import {
  AuthFormField,
  AuthTextInput,
} from "@/components/auth/onboarding/auth-form-field"
import { useUsernameCheck } from "@/hooks/use-username-check"
import { Switch } from "@/components/ui/switch"
import {
  authAlertInfoClass,
  authAlertSuccessClass,
  authBtnPrimaryClass,
  authBtnRowClass,
  authBtnSecondaryClass,
  authChipClass,
  authChipSelectedClass,
  authLabelClass,
  authLeadClass,
  authLinkClass,
  authPanelClass,
  authTextareaClass,
} from "@/components/auth/auth-ui"
import { cn } from "@/lib/utils"
import {
  completeProfile,
  updateProfile,
  setup2FA,
  enable2FA,
  checkAuthWithRetry,
  ensureAuthSession,
  readCachedSetup2FA,
  checkQuickSignToken,
  isQuickSignJwt,
  PROFILE_QUICKSIGN_KEY,
  readProfileOAuthHint,
  clearProfileOAuthHint,
  redirectToAppCallback,
} from "@/lib/api"
import { isValidUsername, sanitizeUsername } from "@/lib/validation/username"
import { getSafeRedirectUrl } from "@/lib/redirect"
import storeCategories from "@/lib/store-categories.json"

type ProfileAuthMode = "session" | "quicksign"
type Step = 1 | 2 | 3 | 4

function CompleteProfileContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const locale = useLocale()
  const t = useTranslations("Auth")

  // Auth state
  const [email, setEmail] = useState("")
  const [authMode, setAuthMode] = useState<ProfileAuthMode | null>(null)
  const [isValidating, setIsValidating] = useState(true)
  const [sessionLost, setSessionLost] = useState(false)

  // Step 1: Personal info
  const [step, setStep] = useState<Step>(1)
  const [fullName, setFullName] = useState("")
  const [username, setUsername] = useState("")
  const {
    usernameAvailable,
    isCheckingUsername,
    scheduleUsernameCheck,
    resetUsernameCheck,
  } = useUsernameCheck()

  // Step 2: Account type
  const [accountType, setAccountType] = useState<AccountType>("user")

  // Step 3: Store setup
  const [storeEnabled, setStoreEnabled] = useState(false)
  const [storeCategory, setStoreCategory] = useState("")
  const [storeDescription, setStoreDescription] = useState("")
  const [employeesCount, setEmployeesCount] = useState("")

  // Step 4: 2FA
  const [twoFAState, setTwoFAState] = useState<"idle" | "scanning" | "success">("idle")
  const [canSetup2FA, setCanSetup2FA] = useState(false)
  const [qrCode, setQrCode] = useState("")
  const [secret, setSecret] = useState("")
  const [otpCode, setOtpCode] = useState("")
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [pendingBackupCodes, setPendingBackupCodes] = useState<string[]>([])
  const [copied, setCopied] = useState(false)

  // General
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [apiError, setApiError] = useState<string | null>(null)

  const stepLabels = [t("personal_info"), t("account_type"), t("store_setup"), t("security")]

  useEffect(() => {
    if (step !== 4) {
      setCanSetup2FA(false)
      return
    }

    let cancelled = false

    const prepareSecurityStep = async () => {
      const cached = readCachedSetup2FA()
      if (cached?.qrCodeUrl) {
        setQrCode(cached.qrCodeUrl)
        setSecret(cached.manualEntryKey || cached.secret)
        setTwoFAState("scanning")
        setCanSetup2FA(true)
        return
      }

      const ready = await ensureAuthSession()
      if (!cancelled) {
        setCanSetup2FA(ready)
        if (!ready) {
          setApiError(t("session_expired"))
        }
      }
    }

    void prepareSecurityStep()

    return () => {
      cancelled = true
    }
  }, [step, t])

  useEffect(() => {
    let cancelled = false

    const validateAccess = async () => {
      const urlToken = searchParams.get("token")

      if (urlToken) {
        if (isQuickSignJwt(urlToken)) {
          sessionStorage.setItem(PROFILE_QUICKSIGN_KEY, urlToken)
          router.replace("/complete-profile")
          return
        }
        router.replace("/login")
        return
      }

      const quicksignToken = sessionStorage.getItem(PROFILE_QUICKSIGN_KEY)
      if (quicksignToken) {
        const check = await checkQuickSignToken(quicksignToken)
        if (cancelled) return

        if (!check.valid || check.used || check.expired) {
          sessionStorage.removeItem(PROFILE_QUICKSIGN_KEY)
          router.replace("/login")
          return
        }
        if (check.email) setEmail(check.email)
        setAuthMode("quicksign")
        setIsValidating(false)
        return
      }

      const session = await checkAuthWithRetry()
      if (cancelled) return

      if (session.authenticated && session.user) {
        clearProfileOAuthHint()
        if (session.user.profileCompleted) {
          const urlNext = searchParams.get("next")
          const sessionNext =
            typeof window !== "undefined" ? localStorage.getItem("auth_next") : null
          window.location.href = getSafeRedirectUrl(urlNext || sessionNext, session.user.role)
          return
        }
        setEmail(session.user.email)
        setAuthMode("session")
        setIsValidating(false)
        return
      }

      const oauthHint = readProfileOAuthHint()
      if (oauthHint) {
        setEmail(oauthHint.email)
        setSessionLost(true)
        setIsValidating(false)
        return
      }

      router.replace("/login")
    }

    validateAccess()
    return () => {
      cancelled = true
    }
  }, [router, searchParams])

  const handleFullNameChange = (value: string) => {
    setFullName(value)
    setErrors({})
    setApiError(null)
  }

  const handleUsernameChange = (value: string) => {
    const cleaned = sanitizeUsername(value)
    setUsername(cleaned)
    setErrors((prev) => ({ ...prev, username: "" }))
    setApiError(null)
    scheduleUsernameCheck(cleaned)
  }

  const validateStep1 = () => {
    const errs: Record<string, string> = {}
    if (!fullName.trim() || fullName.trim().length < 2) errs.fullName = t("full_name_error")
    if (!username.trim() || username.trim().length < 3) errs.username = t("username_error_length")
    if (username && !isValidUsername(username)) errs.username = t("username_error_chars")
    if (usernameAvailable === false) errs.username = t("username_taken")
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateStep1()) setStep(2)
  }

  const resolveDestination = (_type: AccountType) => {
    const urlNext = searchParams.get("next")
    const sessionNext = typeof window !== "undefined" ? localStorage.getItem("auth_next") : null
    const nextTarget = urlNext || sessionNext

    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_next")
    }

    return getSafeRedirectUrl(nextTarget)
  }

  // Submit profile (called when moving from step 2 to step 3)
  const handleSubmitProfile = async () => {
    if (!authMode) return

    setIsLoading(true)
    setApiError(null)
    try {
      const mappedCategory = storeCategory || undefined
      const payload = {
        name: fullName,
        username,
        storeCategory: storeEnabled ? mappedCategory : undefined,
        storeDescription: storeEnabled ? storeDescription : undefined,
        employeesCount: storeEnabled ? employeesCount : undefined,
      }

      if (authMode === "quicksign") {
        const quicksignToken = sessionStorage.getItem(PROFILE_QUICKSIGN_KEY)
        if (!quicksignToken) {
          router.replace("/login")
          return
        }
        await completeProfile({ quickSignToken: quicksignToken, ...payload })
        sessionStorage.removeItem(PROFILE_QUICKSIGN_KEY)
        setAuthMode("session")
        // Allow browser to persist Set-Cookie from complete-profile before /me
        await new Promise((resolve) => setTimeout(resolve, 50))
      } else {
        await updateProfile(payload)
      }

      const sessionReady = await ensureAuthSession()
      if (!sessionReady) {
        setApiError(t("session_expired"))
        return
      }

      setStep(4)
    } catch (err: unknown) {
      const apiErr = err as { data?: { message?: string }; status?: number }
      if (apiErr.status === 409) {
        setStep(1)
        setErrors({ username: t("username_taken") })
        resetUsernameCheck()
      } else if (apiErr.status === 401) {
        setApiError(t("session_expired"))
      } else {
        setApiError(apiErr.data?.message || t("generic_error"))
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Final redirect
  const handleFinish = async () => {
    const destination = resolveDestination(accountType)
    try {
      const destUrl = new URL(
        destination,
        typeof window !== "undefined" ? window.location.origin : "http://localhost:3005",
      )
      if (
        typeof window !== "undefined" &&
        destUrl.origin !== window.location.origin
      ) {
        await redirectToAppCallback(destUrl.origin, destUrl.toString())
        return
      }
    } catch {
      // relative or invalid URL — use as-is
    }
    window.location.href = destination
  }

  // 2FA setup
  const handleSetup2FA = async () => {
    setIsLoading(true)
    setApiError(null)
    try {
      const result = await setup2FA()
      if (!result.qrCodeUrl) {
        setApiError(t("generic_error"))
        return
      }
      setQrCode(result.qrCodeUrl)
      setSecret(result.manualEntryKey || result.secret)
      setPendingBackupCodes(result.backupCodes ?? [])
      setTwoFAState("scanning")
    } catch (err: unknown) {
      const apiErr = err as { data?: { message?: string }; status?: number }
      if (apiErr.status === 429) {
        setApiError(t("rate_limit_2fa_setup"))
      } else if (apiErr.status === 401) {
        setApiError(t("session_expired"))
        setCanSetup2FA(false)
      } else {
        setApiError(apiErr.data?.message || t("generic_error"))
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleEnable2FA = async () => {
    if (otpCode.length < 6) return
    setIsLoading(true)
    try {
      const result = await enable2FA(otpCode)
      const usableCodes = result.backupCodes.filter(
        (code) => code && !code.includes("*"),
      )
      setBackupCodes(
        usableCodes.length > 0 ? usableCodes : pendingBackupCodes,
      )
      setTwoFAState("success")
    } catch {
      setErrors({ otp: t("invalid_code") })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopyCodes = () => {
    navigator.clipboard.writeText(backupCodes.join("\n"))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownloadCodes = () => {
    const blob = new Blob([`Rukny Backup Codes\n${"=".repeat(30)}\n\n${backupCodes.join("\n")}\n\nKeep these codes safe!`], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "rukny-backup-codes.txt"
    a.click()
    URL.revokeObjectURL(url)
  }

  if (isValidating) {
    return (
      <AuthSplitPage
        badge={t("complete_profile_badge")}
        title={t("loading")}
        showFooter={false}
      >
        <AuthStatus variant="loading" message={t("loading")} />
      </AuthSplitPage>
    )
  }

  if (sessionLost) {
    return (
      <AuthSplitPage
        badge={t("complete_profile_badge")}
        title={t("session_expired")}
        description={
          email ? (
            <span className={cn(authAlertInfoClass, "inline-block px-3 py-2")} dir="ltr">
              {email}
            </span>
          ) : undefined
        }
        showFooter={false}
      >
        <AuthStatus
          variant="error"
          message={t("session_expired")}
          actionLabel={t("back_to_login")}
          onAction={() => {
            clearProfileOAuthHint()
            router.push("/login?next=/complete-profile")
          }}
        />
        <AuthFooter className="mt-8" />
      </AuthSplitPage>
    )
  }

  if (!authMode || !email) {
    return null
  }

  const activeCategories = storeCategories.filter((c: { isActive: boolean }) => c.isActive)
  const employeeOptions = [
    { id: "solo", label: t("employees_solo") },
    { id: "2-5", label: t("employees_small") },
    { id: "6-10", label: t("employees_medium") },
    { id: "50+", label: t("employees_large") },
  ]

  const stepHero: Record<
    Step,
    { title: string; description: React.ReactNode }
  > = {
    1: {
      title: t("complete_profile_title"),
      description: t("complete_profile_hello"),
    },
    2: {
      title: t("what_account_type"),
      description: t("what_account_type_desc"),
    },
    3: {
      title: t("store_enable_title"),
      description: t("store_enable_desc"),
    },
    4: {
      title: t("security_title"),
      description: t("security_desc"),
    },
  }

  const hero = stepHero[step]

  return (
    <AuthSplitPage
      badge={t("complete_profile_badge")}
      title={hero.title}
      description={hero.description}
      showFooter={false}
      layoutClassName="max-w-[460px]"
    >
      <OnboardingShell
        steps={stepLabels}
        currentStep={step}
        apiError={apiError}
        footer={<AuthFooter />}
      >
        {step === 1 && (
          <ProfileInfoForm
            fullName={fullName}
            username={username}
            email={email}
            errors={errors}
            usernameAvailable={usernameAvailable}
            isCheckingUsername={isCheckingUsername}
            onFullNameChange={handleFullNameChange}
            onUsernameChange={handleUsernameChange}
            onSubmit={handleStep1}
          />
        )}

        {step === 2 && (
          <AccountTypeStep
            value={accountType}
            onChange={(type) => {
              setAccountType(type)
              if (type === "store") setStoreEnabled(true)
            }}
            onBack={() => setStep(1)}
            onFinish={() => setStep(3)}
            isLoading={false}
          />
        )}

        {step === 3 && (
          <div className="w-full animate-in fade-in slide-in-from-right-4 duration-300">
            <div
              className={cn(
                authPanelClass,
                "mb-5 flex items-center justify-between p-4",
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex size-10 items-center justify-center rounded-xl transition-colors",
                    storeEnabled
                      ? "bg-[#1D1D1D] text-white"
                      : "bg-white text-[#6B6F76] ring-1 ring-[#E8E8E8]",
                  )}
                >
                  <Store className="size-5" strokeWidth={1.5} aria-hidden />
                </div>
                <span
                  className={cn(
                    "text-sm font-medium",
                    storeEnabled ? "text-[#1D1D1D]" : "text-[#6B6F76]",
                  )}
                >
                  {storeEnabled ? t("store_enabled") : t("store_disabled")}
                </span>
              </div>
              <Switch checked={storeEnabled} onCheckedChange={setStoreEnabled} />
            </div>

            {storeEnabled ? (
              <div className="space-y-5 animate-in fade-in slide-in-from-bottom-3 duration-300">
                <div className="space-y-2">
                  <label className={authLabelClass}>
                    {t("store_category_title")}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {activeCategories.map(
                      (cat: {
                        slug: string
                        color: string
                        name: string
                        nameAr: string
                      }) => (
                        <button
                          key={cat.slug}
                          type="button"
                          onClick={() =>
                            setStoreCategory(
                              storeCategory === cat.slug ? "" : cat.slug,
                            )
                          }
                          className={cn(
                            "flex items-center gap-2.5 px-3 py-2.5 text-start text-sm",
                            authChipClass,
                            storeCategory === cat.slug && authChipSelectedClass,
                          )}
                        >
                          <span
                            className="size-2 shrink-0 rounded-full"
                            style={{ backgroundColor: cat.color }}
                          />
                          <span className="truncate">
                            {locale === "ar" ? cat.nameAr : cat.name}
                          </span>
                        </button>
                      ),
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="storeDesc" className={authLabelClass}>
                    {t("store_description_label")}
                  </label>
                  <textarea
                    id="storeDesc"
                    placeholder={t("store_description_placeholder")}
                    value={storeDescription}
                    onChange={(e) => setStoreDescription(e.target.value)}
                    rows={3}
                    className={authTextareaClass}
                  />
                </div>

                <div className="space-y-2">
                  <label className={authLabelClass}>
                    {t("employees_count_label")}
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {employeeOptions.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() =>
                          setEmployeesCount(
                            employeesCount === opt.id ? "" : opt.id,
                          )
                        }
                        className={cn(
                          "px-2 py-2.5 text-center text-xs font-medium",
                          authChipClass,
                          employeesCount === opt.id && authChipSelectedClass,
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}

            <div className={cn(authBtnRowClass, "mt-6")}>
              <button
                type="button"
                onClick={() => setStep(2)}
                className={cn(authBtnSecondaryClass, "flex-1")}
              >
                {t("back")}
              </button>
              <button
                type="button"
                onClick={handleSubmitProfile}
                disabled={isLoading}
                className={cn(authBtnPrimaryClass, "flex-1")}
              >
                {isLoading ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                    {t("saving")}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2">
                    {t("next")}
                    <ArrowUpRight className="size-4 rtl:rotate-180" aria-hidden />
                  </span>
                )}
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="w-full animate-in fade-in slide-in-from-right-4 duration-300">
            {twoFAState === "idle" && (
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={handleSetup2FA}
                  disabled={isLoading || !canSetup2FA}
                  className={authBtnPrimaryClass}
                >
                  {isLoading ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="size-4 animate-spin" aria-hidden />
                      {t("loading")}
                    </span>
                  ) : (
                    t("enable_2fa")
                  )}
                </button>
                {!canSetup2FA && !isLoading ? (
                  <p className={cn(authLeadClass, "text-center text-xs")}>
                    {t("session_expired")}
                  </p>
                ) : null}
                <div className="text-center">
                  <p className={cn(authLeadClass, "mb-3 text-xs")}>
                    {t("2fa_skip_note")}
                  </p>
                  <button
                    type="button"
                    onClick={() => void handleFinish()}
                    className={authLinkClass}
                  >
                    {t("skip_start")} →
                  </button>
                </div>
              </div>
            )}

            {twoFAState === "scanning" && (
              <div className="space-y-5 animate-in fade-in duration-300">
                <p className={cn(authLeadClass, "text-center text-sm")}>
                  {t("setup_2fa_scan")}
                </p>
                {qrCode ? (
                  <div className={cn(authPanelClass, "mx-auto w-fit bg-white p-4")}>
                    <img src={qrCode} alt="QR Code" className="size-48" />
                  </div>
                ) : (
                  <div className="mx-auto flex size-48 items-center justify-center rounded-2xl border border-dashed border-[#E8E8E8] bg-[#FAFAFA]">
                    <Loader2
                      className="size-8 animate-spin text-[#1D1D1D]"
                      aria-hidden
                    />
                  </div>
                )}
                <div className="text-center">
                  <p className={cn(authLeadClass, "mb-1 text-xs")}>
                    {t("setup_2fa_manual")}
                  </p>
                  <code className="select-all break-all rounded-lg bg-[#F5F5F5] px-3 py-1.5 font-mono text-xs text-[#1D1D1D]">
                    {secret}
                  </code>
                </div>
                <AuthFormField
                  label={t("setup_2fa_code_label")}
                  htmlFor="otpCode"
                  error={errors.otp}
                >
                  <AuthTextInput
                    id="otpCode"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder={t("setup_2fa_code_placeholder")}
                    value={otpCode}
                    onChange={(e) => {
                      setOtpCode(e.target.value.replace(/\D/g, ""))
                      setErrors({})
                    }}
                    invalid={!!errors.otp}
                    dir="ltr"
                    className="text-center font-mono text-lg tracking-[0.5em]"
                  />
                </AuthFormField>
                <div className={authBtnRowClass}>
                  <button
                    type="button"
                    onClick={() => setTwoFAState("idle")}
                    className={cn(authBtnSecondaryClass, "flex-1")}
                  >
                    {t("back")}
                  </button>
                  <button
                    type="button"
                    onClick={handleEnable2FA}
                    disabled={isLoading || otpCode.length < 6}
                    className={cn(authBtnPrimaryClass, "flex-1")}
                  >
                    {isLoading ? t("activating_2fa") : t("activate_2fa")}
                  </button>
                </div>
              </div>
            )}

            {twoFAState === "success" && (
              <div className="space-y-5 animate-in fade-in duration-300">
                <div className={authAlertSuccessClass}>{t("2fa_success")}</div>
                <div>
                  <h3 className="mb-1 text-sm font-semibold text-[#1D1D1D]">
                    {t("backup_codes_title")}
                  </h3>
                  <p className={cn(authLeadClass, "mb-3 text-xs")}>
                    {t("backup_codes_desc")}
                  </p>
                  <div className={cn(authPanelClass, "grid grid-cols-2 gap-2 bg-white p-4")}>
                    {backupCodes.map((code, i) => (
                      <code
                        key={i}
                        className="py-1 text-center font-mono text-sm text-[#1D1D1D]"
                      >
                        {code}
                      </code>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleCopyCodes}
                    className={cn(authBtnSecondaryClass, "h-10 flex-1 text-sm")}
                  >
                    {copied ? t("copied") : t("copy_codes")}
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadCodes}
                    className={cn(authBtnSecondaryClass, "h-10 flex-1 text-sm")}
                  >
                    {t("download_codes")}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => void handleFinish()}
                  className={authBtnPrimaryClass}
                >
                  <span className="inline-flex items-center gap-2">
                    {t("start_now")}
                    <ArrowUpRight className="size-4 rtl:rotate-180" aria-hidden />
                  </span>
                </button>
              </div>
            )}
          </div>
        )}
      </OnboardingShell>
    </AuthSplitPage>
  )
}

export default function CompleteProfilePage() {
  return (
    <React.Suspense fallback={<AuthLoadingFallback />}>
      <CompleteProfileContent />
    </React.Suspense>
  )
}
