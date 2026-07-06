"use client"

import React, { useEffect, useState, useCallback, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useTranslations, useLocale } from "next-intl"
import { AuthLayout } from "@/components/auth/auth-layout"
import { AuthFooter } from "@/components/auth/auth-footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import {
  completeProfile,
  updateProfile,
  checkUsername,
  setup2FA,
  enable2FA,
  checkAuthWithRetry,
  checkQuickSignToken,
  isQuickSignJwt,
  PROFILE_QUICKSIGN_KEY,
  readProfileOAuthHint,
  clearProfileOAuthHint,
  redirectToAppCallback,
} from "@/lib/api"
import { getSafeRedirectUrl } from "@/lib/redirect"
import storeCategories from "@/lib/store-categories.json"

type ProfileAuthMode = "session" | "quicksign"
type Step = 1 | 2 | 3

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
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null)
  const [isCheckingUsername, setIsCheckingUsername] = useState(false)

  // Step 2: Store setup
  const [storeEnabled, setStoreEnabled] = useState(false)
  const [storeCategory, setStoreCategory] = useState("")
  const [storeDescription, setStoreDescription] = useState("")
  const [employeesCount, setEmployeesCount] = useState("")

  // Step 3: 2FA
  const [twoFAState, setTwoFAState] = useState<"idle" | "scanning" | "success">("idle")
  const [qrCode, setQrCode] = useState("")
  const [secret, setSecret] = useState("")
  const [otpCode, setOtpCode] = useState("")
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [copied, setCopied] = useState(false)

  // General
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [apiError, setApiError] = useState<string | null>(null)
  const debounceTimer = useRef<NodeJS.Timeout>(null)

  const stepLabels = [t("personal_info"), t("store_setup"), t("security")]

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

  // Username check
  const checkUsernameAvailability = useCallback(async (value: string) => {
    if (value.length < 3 || !/^[a-z0-9_]+$/.test(value)) {
      setUsernameAvailable(null)
      return
    }
    setIsCheckingUsername(true)
    try {
      const result = await checkUsername(value)
      setUsernameAvailable(result.available)
    } catch {
      setUsernameAvailable(null)
    } finally {
      setIsCheckingUsername(false)
    }
  }, [])

  const handleUsernameChange = (value: string) => {
    const cleaned = value.toLowerCase().replace(/[^a-z0-9_]/g, "")
    setUsername(cleaned)
    setUsernameAvailable(null)
    setErrors((e) => ({ ...e, username: "" }))
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    if (cleaned.length >= 3) {
      debounceTimer.current = setTimeout(() => checkUsernameAvailability(cleaned), 500)
    }
  }

  const validateStep1 = () => {
    const errs: Record<string, string> = {}
    if (!fullName.trim() || fullName.trim().length < 2) errs.fullName = t("full_name_error")
    if (!username.trim() || username.trim().length < 3) errs.username = t("username_error_length")
    if (username && !/^[a-z0-9_]+$/.test(username)) errs.username = t("username_error_chars")
    if (usernameAvailable === false) errs.username = t("username_taken")
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateStep1()) setStep(2)
  }

  // Submit profile (called when moving from step 2 to step 3)
  const handleSubmitProfile = async () => {
    if (!authMode) return

    setIsLoading(true)
    setApiError(null)
    try {
      const categorySlugMap: Record<string, string> = {
        "food-beverages": "food",
        "kids-baby": "kids",
      }
      const mappedCategory = storeCategory ? (categorySlugMap[storeCategory] || storeCategory) : undefined
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
      } else {
        await updateProfile(payload)
      }
      setStep(3)
    } catch (err: unknown) {
      const apiErr = err as { data?: { message?: string }; status?: number }
      if (apiErr.status === 409) {
        setStep(1)
        setErrors({ username: t("username_taken") })
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
    const urlNext = searchParams.get("next")
    const sessionNext = typeof window !== "undefined" ? localStorage.getItem("auth_next") : null
    const nextTarget = urlNext || sessionNext
    if (typeof window !== "undefined") localStorage.removeItem("auth_next")

    const destination = getSafeRedirectUrl(nextTarget)
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
    try {
      const result = await setup2FA()
      setQrCode(result.qrCodeDataUrl)
      setSecret(result.secret)
      setTwoFAState("scanning")
    } catch {
      setApiError(t("generic_error"))
    } finally {
      setIsLoading(false)
    }
  }

  const handleEnable2FA = async () => {
    if (otpCode.length < 6) return
    setIsLoading(true)
    try {
      const result = await enable2FA(otpCode)
      setBackupCodes(result.backupCodes)
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
      <AuthLayout showLogo={true}>
        <div className="w-full text-center py-12">
          <div className="size-10 mx-auto rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground mt-4">{t("loading")}</p>
        </div>
      </AuthLayout>
    )
  }

  if (sessionLost) {
    return (
      <AuthLayout showLogo={true}>
        <div className="w-full text-center space-y-4 py-8">
          <p className="text-sm text-destructive">{t("session_expired")}</p>
          {email && (
            <p className="text-sm text-muted-foreground" dir="ltr">
              {email}
            </p>
          )}
          <Button
            type="button"
            size="lg"
            className="w-full h-12 rounded-full"
            onClick={() => {
              clearProfileOAuthHint()
              router.push("/login?next=/complete-profile")
            }}
          >
            {t("back_to_login")}
          </Button>
        </div>
        <AuthFooter />
      </AuthLayout>
    )
  }

  if (!authMode || !email) {
    return null
  }

  const activeCategories = storeCategories.filter((c: any) => c.isActive)
  const employeeOptions = [
    { id: "solo", label: t("employees_solo") },
    { id: "2-5", label: t("employees_small") },
    { id: "6-10", label: t("employees_medium") },
    { id: "50+", label: t("employees_large") },
  ]

  return (
    <AuthLayout showLogo={true}>
      {/* Stepper */}
      <div className="w-full flex items-center gap-1.5 mb-8">
        {[1, 2, 3].map((s) => (
          <React.Fragment key={s}>
            <div className="flex items-center gap-1.5">
              <div className={cn(
                "size-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300",
                s < step ? "bg-primary text-primary-foreground scale-90" :
                s === step ? "bg-primary text-primary-foreground ring-4 ring-primary/20" :
                "bg-muted text-muted-foreground"
              )}>
                {s < step ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                ) : s}
              </div>
              <span className={cn("text-xs hidden sm:block transition-colors", s <= step ? "text-foreground font-medium" : "text-muted-foreground")}>
                {stepLabels[s - 1]}
              </span>
            </div>
            {s < 3 && <div className={cn("flex-1 h-0.5 rounded-full transition-colors duration-500", step > s ? "bg-primary" : "bg-border")} />}
          </React.Fragment>
        ))}
      </div>

      {apiError && (
        <div className="w-full mb-4 p-3 rounded-xl bg-destructive/10 text-sm text-destructive text-center animate-in fade-in slide-in-from-top-2">
          {apiError}
        </div>
      )}

      {/* ─── Step 1: Personal Info ─── */}
      {step === 1 && (
        <form onSubmit={handleStep1} className="w-full space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-foreground tracking-tight mb-1">{t("complete_profile_title")}</h1>
            <p className="text-sm text-muted-foreground">
              {t("complete_profile_hello")} <span className="text-foreground font-medium" dir="ltr">{email}</span>
            </p>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="fullName" className="text-sm font-medium text-foreground block text-start">{t("full_name_label")}</label>
            <Input id="fullName" type="text" placeholder={t("full_name_placeholder")} value={fullName}
              onChange={(e) => { setFullName(e.target.value); setErrors({}) }} aria-invalid={!!errors.fullName} autoFocus />
            {errors.fullName && <p className="text-xs text-destructive text-start">{errors.fullName}</p>}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="username" className="text-sm font-medium text-foreground block text-start">{t("username_label")}</label>
            <div className="relative">
              <span className="absolute inset-y-0 start-4 flex items-center text-sm text-muted-foreground pointer-events-none">@</span>
              <Input id="username" type="text" placeholder="username" value={username}
                onChange={(e) => handleUsernameChange(e.target.value)} aria-invalid={!!errors.username} className="ps-8" dir="ltr" />
              {username.length >= 3 && (
                <span className="absolute inset-y-0 end-3 flex items-center">
                  {isCheckingUsername ? (
                    <div className="size-4 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
                  ) : usernameAvailable === true ? (
                    <svg className="size-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>
                  ) : usernameAvailable === false ? (
                    <svg className="size-4 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
                  ) : null}
                </span>
              )}
            </div>
            {errors.username && <p className="text-xs text-destructive text-start">{errors.username}</p>}
            {usernameAvailable === true && !errors.username && <p className="text-xs text-green-600 text-start">{t("username_available")}</p>}
          </div>

          <Button type="submit" size="lg" disabled={isCheckingUsername || usernameAvailable === false}
            className="w-full h-12 rounded-full bg-primary text-primary-foreground text-base font-medium mt-2">
            {t("next")}
          </Button>
        </form>
      )}

      {/* ─── Step 2: Store Setup ─── */}
      {step === 2 && (
        <div className="w-full animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-foreground tracking-tight mb-1">{t("store_enable_title")}</h1>
            <p className="text-sm text-muted-foreground">{t("store_enable_desc")}</p>
          </div>

          {/* Store Toggle */}
          <div className="flex items-center justify-between p-4 rounded-2xl border border-border bg-muted/20 mb-5">
            <div className="flex items-center gap-3">
              <div className={cn("size-10 rounded-xl flex items-center justify-center transition-colors", storeEnabled ? "bg-secondary text-foreground" : "bg-muted text-muted-foreground")}>
                <svg xmlns="http://www.w3.org/2000/svg" className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z" />
                </svg>
              </div>
              <span className={cn("text-sm font-medium", storeEnabled ? "text-foreground" : "text-muted-foreground")}>
                {storeEnabled ? t("store_enabled") : t("store_disabled")}
              </span>
            </div>
            <Switch checked={storeEnabled} onCheckedChange={setStoreEnabled} />
          </div>

          {/* Store Details (animated) */}
          {storeEnabled && (
            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-3 duration-300">
              {/* Category Grid */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground block text-start">{t("store_category_title")}</label>
                <div className="grid grid-cols-2 gap-2">
                  {activeCategories.map((cat: any) => (
                    <button key={cat.slug} type="button"
                      onClick={() => setStoreCategory(storeCategory === cat.slug ? "" : cat.slug)}
                      className={cn(
                        "flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-start text-sm transition-all cursor-pointer",
                        storeCategory === cat.slug
                          ? "border-primary bg-primary/5 text-foreground font-medium shadow-sm"
                          : "border-border bg-background text-muted-foreground hover:border-primary/30 hover:bg-muted/30"
                      )}>
                      <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                      <span className="truncate">{locale === "ar" ? cat.nameAr : cat.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label htmlFor="storeDesc" className="text-sm font-medium text-foreground block text-start">{t("store_description_label")}</label>
                <Textarea id="storeDesc" placeholder={t("store_description_placeholder")} value={storeDescription}
                  onChange={(e) => setStoreDescription(e.target.value)} rows={3} />
              </div>

              {/* Employees Count */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground block text-start">{t("employees_count_label")}</label>
                <div className="grid grid-cols-4 gap-2">
                  {employeeOptions.map((opt) => (
                    <button key={opt.id} type="button"
                      onClick={() => setEmployeesCount(employeesCount === opt.id ? "" : opt.id)}
                      className={cn(
                        "rounded-xl border px-2 py-2.5 text-xs text-center transition-all cursor-pointer font-medium",
                        employeesCount === opt.id
                          ? "border-primary bg-primary/5 text-foreground shadow-sm"
                          : "border-border bg-background text-muted-foreground hover:border-primary/30"
                      )}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3 mt-6">
            <Button type="button" variant="outline" size="lg" onClick={() => setStep(1)} className="flex-1 h-12 rounded-full">{t("back")}</Button>
            <Button type="button" size="lg" onClick={handleSubmitProfile} disabled={isLoading}
              className="flex-1 h-12 rounded-full bg-primary text-primary-foreground text-base font-medium">
              {isLoading ? t("saving") : t("next")}
            </Button>
          </div>
        </div>
      )}

      {/* ─── Step 3: Security (2FA) ─── */}
      {step === 3 && (
        <div className="w-full animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="text-center mb-6">
            <div className="size-14 mx-auto mb-4 rounded-2xl bg-secondary flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="size-7 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight mb-1">{t("security_title")}</h1>
            <p className="text-sm text-muted-foreground">{t("security_desc")}</p>
          </div>

          {/* Idle: Show enable button */}
          {twoFAState === "idle" && (
            <div className="space-y-4">
              <Button type="button" size="lg" onClick={handleSetup2FA} disabled={isLoading}
                className="w-full h-12 rounded-full bg-primary text-primary-foreground text-base font-medium">
                {isLoading ? t("loading") : t("enable_2fa")}
              </Button>
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-3">{t("2fa_skip_note")}</p>
                <Button type="button" variant="ghost" size="sm" onClick={() => void handleFinish()} className="text-sm text-muted-foreground hover:text-foreground">
                  {t("skip_start")} →
                </Button>
              </div>
            </div>
          )}

          {/* Scanning: QR + OTP input */}
          {twoFAState === "scanning" && (
            <div className="space-y-5 animate-in fade-in duration-300">
              <p className="text-sm text-center text-muted-foreground">{t("setup_2fa_scan")}</p>
              {qrCode && (
                <div className="mx-auto w-fit p-4 bg-white rounded-2xl shadow-sm border">
                  <img src={qrCode} alt="QR Code" className="size-48" />
                </div>
              )}
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">{t("setup_2fa_manual")}</p>
                <code className="text-xs bg-muted px-3 py-1.5 rounded-lg font-mono select-all break-all">{secret}</code>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="otpCode" className="text-sm font-medium text-foreground block text-start">{t("setup_2fa_code_label")}</label>
                <Input id="otpCode" type="text" inputMode="numeric" maxLength={6} placeholder={t("setup_2fa_code_placeholder")}
                  value={otpCode} onChange={(e) => { setOtpCode(e.target.value.replace(/\D/g, "")); setErrors({}) }}
                  aria-invalid={!!errors.otp} dir="ltr" className="text-center text-lg tracking-[0.5em] font-mono" />
                {errors.otp && <p className="text-xs text-destructive text-center">{errors.otp}</p>}
              </div>
              <div className="flex gap-3">
                <Button type="button" variant="outline" size="lg" onClick={() => setTwoFAState("idle")} className="flex-1 h-12 rounded-full">{t("back")}</Button>
                <Button type="button" size="lg" onClick={handleEnable2FA} disabled={isLoading || otpCode.length < 6}
                  className="flex-1 h-12 rounded-full bg-primary text-primary-foreground text-base font-medium">
                  {isLoading ? t("activating_2fa") : t("activate_2fa")}
                </Button>
              </div>
            </div>
          )}

          {/* Success: Backup codes */}
          {twoFAState === "success" && (
            <div className="space-y-5 animate-in fade-in duration-300">
              <div className="text-center p-3 rounded-xl bg-green-500/10 text-green-600 text-sm font-medium">{t("2fa_success")}</div>
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-1">{t("backup_codes_title")}</h3>
                <p className="text-xs text-muted-foreground mb-3">{t("backup_codes_desc")}</p>
                <div className="grid grid-cols-2 gap-2 p-4 rounded-xl bg-muted/40 border border-border">
                  {backupCodes.map((code, i) => (
                    <code key={i} className="text-sm font-mono text-foreground text-center py-1">{code}</code>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={handleCopyCodes} className="flex-1 h-10 rounded-full text-sm">
                  {copied ? t("copied") : t("copy_codes")}
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={handleDownloadCodes} className="flex-1 h-10 rounded-full text-sm">
                  {t("download_codes")}
                </Button>
              </div>
              <Button type="button" size="lg" onClick={() => void handleFinish()}
                className="w-full h-12 rounded-full bg-primary text-primary-foreground text-base font-medium">
                {t("start_now")} 🚀
              </Button>
            </div>
          )}
        </div>
      )}

      <AuthFooter />
    </AuthLayout>
  )
}

export default function CompleteProfilePage() {
  return (
    <React.Suspense fallback={
      <AuthLayout showLogo={true}>
        <div className="w-full text-center py-12">
          <div className="size-10 mx-auto rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      </AuthLayout>
    }>
      <CompleteProfileContent />
    </React.Suspense>
  )
}
