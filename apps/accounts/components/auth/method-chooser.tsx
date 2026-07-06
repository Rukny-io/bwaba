"use client"

import React from "react"
import { cn } from "@/lib/utils"
import { useTranslations } from "next-intl"

export type VerificationMethod = "authenticator" | "backup-code" | "email" | "whatsapp"

interface Method {
  id: VerificationMethod
  icon: React.ReactNode
  label: string
  description: string
  requires2FA?: boolean
  requiresSubscription?: boolean
}

const methods: Method[] = [
  {
    id: "authenticator",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="size-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"
        />
      </svg>
    ),
    label: "تطبيق المصادقة",
    description: "أو ما يشابهه",
    requires2FA: true,
  },
  {
    id: "backup-code",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="size-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 0 1 21.75 8.25Z"
        />
      </svg>
    ),
    label: "رمز الاسترداد",
    description: "استخدم أحد رموز الطوارئ",
    requires2FA: true,
  },
  {
    id: "email",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="size-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"
        />
      </svg>
    ),
    label: "البريد الإلكتروني",
    description: "إعادة إرسال رابط تسجيل الدخول",
  },
  {
    id: "whatsapp",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="size-5"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
      </svg>
    ),
    label: "الواتساب",
    description: "تلقي الرمز عبر الواتساب",
    requiresSubscription: true,
  },
]

interface MethodChooserProps {
  onSelect: (method: VerificationMethod) => void
  has2FA?: boolean
  isSubscribed?: boolean
  className?: string
  isLoading?: boolean
}

export function MethodChooser({
  onSelect,
  has2FA = false,
  isSubscribed = false,
  className,
  isLoading = false,
}: MethodChooserProps) {
  const t = useTranslations("Auth")

  return (
    <div className={cn("w-full max-w-sm mx-auto", className)}>
      <div className="text-center mb-8">
        <h1 
          className="text-2xl font-bold text-foreground leading-tight tracking-tight"
          dangerouslySetInnerHTML={{ __html: t("choose_method_heading") }}
        />
      </div>

      <div className="space-y-3">
        {methods.map((method, index) => {
          // دائمًا نظهر البريد الإلكتروني فوراً
          if (method.id === "email") {
            return (
              <button
                key={method.id}
                type="button"
                onClick={() => onSelect(method.id)}
                className={cn(
                  "w-full flex items-center gap-4 rounded-3xl border border-border/80 bg-background px-5 py-4",
                  "text-start transition-all duration-300",
                  "hover:border-primary/40 hover:bg-muted/30 hover:shadow-sm active:scale-[0.99]",
                  "cursor-pointer animate-in fade-in slide-in-from-bottom-2 fill-mode-both"
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <span className="text-muted-foreground flex-shrink-0">{method.icon}</span>
                <div className="flex-1 min-w-0">
                  <span className="text-md font-medium text-foreground">{t(`method_${method.id.replace("-", "_")}` as any)}</span>
                  <p className="text-xs text-muted-foreground truncate">{t(`method_${method.id.replace("-", "_")}_desc` as any)}</p>
                </div>
              </button>
            )
          }

          // إذا كنا في حالة تحميل ولا نعرف بعد إذا كان لديه 2FA أو واتساب
          if (isLoading && (method.requires2FA || method.requiresSubscription)) {
            // نظهر الهيكل العظمي فقط للخيارات المحتملة
            return (
              <div
                key={method.id}
                className="w-full h-[76px] rounded-3xl bg-muted/40 animate-pulse"
              />
            )
          }

          // الفلترة الفعلية بعد انتهاء التحميل
          if (method.requires2FA && !has2FA) return null
          
          const isDisabled = method.requiresSubscription && !isSubscribed

          return (
            <button
              key={method.id}
              type="button"
              disabled={isDisabled}
              onClick={() => onSelect(method.id)}
              className={cn(
                "w-full flex items-center gap-4 rounded-3xl border border-border/80 bg-background px-5 py-4",
                "text-start transition-all duration-300",
                "hover:border-primary/40 hover:bg-muted/30 hover:shadow-sm active:scale-[0.99]",
                "cursor-pointer animate-in fade-in slide-in-from-bottom-2 fill-mode-both",
                isDisabled && "opacity-60 cursor-not-allowed hover:bg-background hover:border-border/80 hover:shadow-none active:scale-100"
              )}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <span className="text-muted-foreground flex-shrink-0">{method.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-md font-medium text-foreground">{t(`method_${method.id.replace("-", "_")}` as any)}</span>
                  {isDisabled && (
                    <span className="text-[10px] bg-secondary text-foreground px-2 py-0.5 rounded-full font-medium">
                      {t("for_subscribers")}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">{t(`method_${method.id.replace("-", "_")}_desc` as any)}</p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
