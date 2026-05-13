"use client"

import React, { useEffect, useState, useCallback, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { AuthLayout } from "@/components/auth/auth-layout"
import { AuthFooter } from "@/components/auth/auth-footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { completeProfile, checkUsername } from "@/lib/api"
import { getRedirectUrlByRole, getSafeRedirectUrl } from "@/lib/redirect"


function CompleteProfileContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState("")
  const [token, setToken] = useState("")
  const [step, setStep] = useState<1 | 2>(1)
  const [fullName, setFullName] = useState("")
  const [username, setUsername] = useState("")
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null)
  const [isCheckingUsername, setIsCheckingUsername] = useState(false)
  const [storeCategory, setStoreCategory] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [apiError, setApiError] = useState<string | null>(null)
  const debounceTimer = useRef<NodeJS.Timeout>(null)

  useEffect(() => {
    const emailParam = searchParams.get("email")
    const tokenParam = searchParams.get("token")
    if (!emailParam || !tokenParam) {
      router.replace("/login")
      return
    }
    setEmail(emailParam)
    setToken(tokenParam)
  }, [router, searchParams])

  // التحقق من اسم المستخدم مع debounce
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
    if (!fullName.trim() || fullName.trim().length < 2) {
      errs.fullName = "يرجى إدخال اسمك الكامل (حرفان على الأقل)"
    }
    if (!username.trim() || username.trim().length < 3) {
      errs.username = "اسم المستخدم يجب أن يكون 3 أحرف على الأقل"
    }
    if (!/^[a-z0-9_]+$/.test(username)) {
      errs.username = "أحرف إنجليزية صغيرة، أرقام، أو _ فقط"
    }
    if (usernameAvailable === false) {
      errs.username = "اسم المستخدم محجوز بالفعل"
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateStep1()) setStep(2)
  }

  const handleFinish = async () => {
    setIsLoading(true)
    setApiError(null)

    try {
      const response = await completeProfile({
        quickSignToken: token,
        name: fullName,
        username,
        storeCategory: storeCategory || undefined,
      })

      // تم الإنشاء — الكوكيز تم تعيينها من API
      const urlNext = searchParams.get("next")
      const sessionNext = sessionStorage.getItem("auth_next")
      const nextTarget = urlNext || sessionNext
      sessionStorage.removeItem("auth_next")

      window.location.href = getSafeRedirectUrl(nextTarget, response.user?.role)
    } catch (err: unknown) {
      const apiErr = err as { data?: { message?: string }; status?: number }
      if (apiErr.status === 409) {
        setStep(1)
        setErrors({ username: "اسم المستخدم محجوز بالفعل" })
      } else if (apiErr.status === 401) {
        setApiError("انتهت صلاحية الرابط. يرجى طلب رابط جديد.")
      } else {
        setApiError(apiErr.data?.message || "حدث خطأ. يرجى المحاولة مجدداً.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (!email || !token) return null

  const categories = [
    { id: "retail", label: "تجارة تجزئة" },
    { id: "food", label: "مطاعم وأطعمة" },
    { id: "services", label: "خدمات" },
    { id: "tech", label: "تقنية" },
    { id: "education", label: "تعليم" },
    { id: "health", label: "صحة" },
    { id: "other", label: "أخرى" },
  ]

  return (
    <AuthLayout showLogo={true}>
      {/* Stepper */}
      <div className="w-full flex items-center gap-2 mb-8">
        {[1, 2].map((s) => (
          <React.Fragment key={s}>
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "size-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors",
                  s <= step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                )}
              >
                {s < step ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                ) : (
                  s
                )}
              </div>
              <span className={cn("text-xs hidden sm:block", s <= step ? "text-foreground font-medium" : "text-muted-foreground")}>
                {s === 1 ? "بياناتك الشخصية" : "تصنيف النشاط"}
              </span>
            </div>
            {s < 2 && <div className={cn("flex-1 h-px", step > s ? "bg-primary" : "bg-border")} />}
          </React.Fragment>
        ))}
      </div>

      {apiError && (
        <div className="w-full mb-4 p-3 rounded-lg bg-destructive/10 text-sm text-destructive text-center">
          {apiError}
        </div>
      )}

      {/* Step 1 */}
      {step === 1 && (
        <form onSubmit={handleStep1} className="w-full space-y-4">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-semibold text-foreground mb-1">أكمل ملفك الشخصي</h1>
            <p className="text-sm text-muted-foreground">
              مرحباً! <span className="text-foreground font-medium" dir="ltr">{email}</span>
            </p>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="fullName" className="text-sm font-medium text-foreground block text-right">
              الاسم الكامل
            </label>
            <Input
              id="fullName"
              type="text"
              placeholder="محمد عبدالله"
              value={fullName}
              onChange={(e) => { setFullName(e.target.value); setErrors({}) }}
              aria-invalid={!!errors.fullName}
              autoFocus
            />
            {errors.fullName && <p className="text-xs text-destructive text-right">{errors.fullName}</p>}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="username" className="text-sm font-medium text-foreground block text-right">
              اسم المستخدم
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 start-4 flex items-center text-sm text-muted-foreground pointer-events-none">@</span>
              <Input
                id="username"
                type="text"
                placeholder="username"
                value={username}
                onChange={(e) => handleUsernameChange(e.target.value)}
                aria-invalid={!!errors.username}
                className="ps-8"
                dir="ltr"
              />
              {/* مؤشر التحقق */}
              {username.length >= 3 && (
                <span className="absolute inset-y-0 end-3 flex items-center">
                  {isCheckingUsername ? (
                    <div className="size-4 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
                  ) : usernameAvailable === true ? (
                    <svg className="size-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                  ) : usernameAvailable === false ? (
                    <svg className="size-4 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                  ) : null}
                </span>
              )}
            </div>
            {errors.username && <p className="text-xs text-destructive text-right">{errors.username}</p>}
            {usernameAvailable === true && !errors.username && (
              <p className="text-xs text-green-600 text-right">✓ اسم المستخدم متاح</p>
            )}
          </div>

          <Button
            type="submit"
            size="lg"
            disabled={isCheckingUsername || usernameAvailable === false}
            className="w-full h-12 rounded-full bg-primary text-primary-foreground text-base font-medium mt-2"
          >
            التالي
          </Button>
        </form>
      )}

      {/* Step 2 */}
      {step === 2 && (
        <div className="w-full">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-semibold text-foreground mb-1">تصنيف نشاطك</h1>
            <p className="text-sm text-muted-foreground">اختر التصنيف الأقرب لنشاطك (اختياري)</p>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-6">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setStoreCategory(storeCategory === cat.id ? "" : cat.id)}
                className={cn(
                  "rounded-full border px-4 py-2.5 text-sm text-center transition-all cursor-pointer",
                  storeCategory === cat.id
                    ? "border-foreground bg-foreground/5 text-foreground font-medium"
                    : "border-border bg-background text-muted-foreground hover:border-foreground/30"
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => setStep(1)}
              className="flex-1 h-12 rounded-full"
            >
              رجوع
            </Button>
            <Button
              type="button"
              size="lg"
              onClick={handleFinish}
              disabled={isLoading}
              className="flex-1 h-12 rounded-full bg-primary text-primary-foreground text-base font-medium"
            >
              {isLoading ? "جارٍ الحفظ..." : "ابدأ الآن"}
            </Button>
          </div>
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
