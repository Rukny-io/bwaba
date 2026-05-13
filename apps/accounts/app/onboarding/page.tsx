"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { AuthLayout } from "@/components/auth/auth-layout"
import { AuthFooter } from "@/components/auth/auth-footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

type AccountType = "user" | "store" | "developer"

interface AccountTypeOption {
  id: AccountType
  icon: React.ReactNode
  label: string
  description: string
}

const accountTypes: AccountTypeOption[] = [
  {
    id: "user",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
      </svg>
    ),
    label: "مستخدم عادي",
    description: "إدارة روابطي وملفي الشخصي",
  },
  {
    id: "store",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z" />
      </svg>
    ),
    label: "صاحب متجر",
    description: "إدارة متجر ومنتجات تجارية",
  },
  {
    id: "developer",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" />
      </svg>
    ),
    label: "مطوّر",
    description: "الوصول إلى API والأدوات التقنية",
  },
]

async function completeProfile(data: {
  fullName: string
  username: string
  accountType: AccountType
}): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 1200))
  // POST /api/v1/users/profile/complete { ...data }
}

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2>(1)
  const [fullName, setFullName] = useState("")
  const [username, setUsername] = useState("")
  const [accountType, setAccountType] = useState<AccountType>("user")
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateStep1 = () => {
    const errs: Record<string, string> = {}
    if (!fullName.trim() || fullName.trim().length < 2)
      errs.fullName = "يرجى إدخال اسمك الكامل (حرفان على الأقل)"
    if (!username.trim() || username.trim().length < 3)
      errs.username = "اسم المستخدم يجب أن يكون 3 أحرف على الأقل"
    if (!/^[a-z0-9_]+$/.test(username))
      errs.username = "اسم المستخدم: أحرف إنجليزية صغيرة، أرقام، أو _"
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateStep1()) setStep(2)
  }

  const handleFinish = async () => {
    setIsLoading(true)
    try {
      await completeProfile({ fullName, username, accountType })
      const redirectMap: Record<AccountType, string> = {
        user: process.env.NEXT_PUBLIC_APP_URL || "https://app.rukny.io",
        store: process.env.NEXT_PUBLIC_BUSINESS_URL || "https://business.rukny.io",
        developer: process.env.NEXT_PUBLIC_DEVELOPERS_URL || "https://developers.rukny.io",
      }
      window.location.href = redirectMap[accountType]
    } finally {
      setIsLoading(false)
    }
  }

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
                  s <= step
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {s < step ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                ) : s}
              </div>
              <span className={cn("text-xs hidden sm:block", s <= step ? "text-foreground font-medium" : "text-muted-foreground")}>
                {s === 1 ? "بياناتك الشخصية" : "نوع الحساب"}
              </span>
            </div>
            {s < 2 && <div className={cn("flex-1 h-px", step > s ? "bg-primary" : "bg-border")} />}
          </React.Fragment>
        ))}
      </div>

      {/* Step 1: Personal Info */}
      {step === 1 && (
        <form onSubmit={handleStep1} className="w-full space-y-4">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-semibold text-foreground mb-1">أكمل ملفك الشخصي</h1>
            <p className="text-sm text-muted-foreground">أخبرنا قليلاً عن نفسك</p>
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
              <span className="absolute inset-y-0 start-4 flex items-center text-sm text-muted-foreground pointer-events-none">
                @
              </span>
              <Input
                id="username"
                type="text"
                placeholder="username"
                value={username}
                onChange={(e) => { setUsername(e.target.value.toLowerCase()); setErrors({}) }}
                aria-invalid={!!errors.username}
                className="ps-8"
                dir="ltr"
              />
            </div>
            {errors.username && <p className="text-xs text-destructive text-right">{errors.username}</p>}
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full h-12 rounded-full bg-primary text-primary-foreground text-base font-medium mt-2"
          >
            التالي
          </Button>
        </form>
      )}

      {/* Step 2: Account Type */}
      {step === 2 && (
        <div className="w-full">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-semibold text-foreground mb-1">ما نوع حسابك؟</h1>
            <p className="text-sm text-muted-foreground">سنقوم بتهيئة المنصة لتناسبك</p>
          </div>

          <div className="space-y-3 mb-6">
            {accountTypes.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setAccountType(opt.id)}
                className={cn(
                  "w-full flex items-center gap-3 rounded-full border px-5 py-4 text-right",
                  "transition-all duration-150 cursor-pointer",
                  accountType === opt.id
                    ? "border-foreground bg-foreground/5"
                    : "border-border bg-background hover:border-foreground/30 hover:bg-muted/50"
                )}
              >
                <span className={cn("flex-shrink-0", accountType === opt.id ? "text-foreground" : "text-muted-foreground")}>
                  {opt.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{opt.label}</p>
                  <p className="text-xs text-muted-foreground">{opt.description}</p>
                </div>
                {accountType === opt.id && (
                  <svg xmlns="http://www.w3.org/2000/svg" className="size-4 text-foreground flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                )}
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
