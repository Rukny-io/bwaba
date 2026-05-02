"use client";

/**
 * 🚀 Welcome Banner
 * بانر ترحيب للمستخدم الجديد — يُخفى بعد الإغلاق
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Rocket, Link2, X } from "lucide-react";

interface WelcomeBannerProps {
  hasProducts: boolean;
  hasOrders: boolean;
}

export function WelcomeBanner({ hasProducts, hasOrders }: WelcomeBannerProps) {
  const router = useRouter();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("rukny_app_welcome_dismissed") === "true") {
      setDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem("rukny_app_welcome_dismissed", "true");
  };

  // إخفاء البانر إذا أُغلق أو إذا كان المستخدم يملك نشاطاً
  if (dismissed || (hasProducts && hasOrders)) return null;

  return (
    <div className="relative overflow-hidden rounded-4xl bg-brand-purple-100/60 dark:bg-brand-black-200 border border-brand-purple-200/60 dark:border-brand-black-200 p-5 sm:p-6">
      {/* Dismiss */}
      <button
        onClick={handleDismiss}
        className="absolute top-3 end-3 p-1 rounded-lg text-brand-grey-200 dark:text-brand-grey-300 hover:text-foreground hover:bg-brand-purple-100 dark:hover:bg-brand-black-300 transition-colors"
        aria-label="إغلاق"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Content */}
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-brand-purple-300/15 dark:bg-brand-purple-300/20 flex items-center justify-center">
          <Rocket className="w-5 h-5 text-brand-purple-300 dark:text-brand-purple-200" />
        </div>

        <div className="min-w-0">
          <h3 className="text-sm font-bold text-brand-black-300 dark:text-brand-white mb-1">
            مرحباً بك في ركني! 
          </h3>
          <p className="text-xs text-brand-grey-200 dark:text-brand-grey-300 mb-3">
            ابدأ رحلتك بإضافة منتجاتك وإعداد متجرك الإلكتروني
          </p>

          <div className="flex flex-wrap gap-2">
            {!hasProducts && (
              <button
                onClick={() => router.push("/app/products/new")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-brand-purple-300 dark:bg-brand-purple-200 text-brand-white dark:text-brand-black-300 text-xs font-medium hover:opacity-90 transition-opacity"
              >
                <Link2 className="w-3.5 h-3.5" />
                <span>أضف منتجاً</span>
              </button>
            )}
            <button
              onClick={() => router.push("/app/settings/store")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-brand-white dark:bg-brand-black-300 text-brand-black-300 dark:text-brand-white text-xs font-medium hover:bg-brand-purple-100 dark:hover:bg-brand-black-200 transition-colors border border-brand-purple-100 dark:border-brand-black-200"
            >
              <span>إعداد المتجر</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
