import type { ReactNode } from 'react';
import { getUser } from '@/lib/dal';
import { Sidebar } from '@/components/(app)/dashboard/sidebar';
import { DashboardNav } from '@/components/(app)/dashboard/dashboard-nav';
import { CollapsiblePhonePreview } from '@/components/(app)/shared/CollapsiblePhonePreview';
import { MobileDock } from '@/components/(app)/dashboard/mobile-dock';

/**
 * Layout للمنطقة المحمية (/app).
 * Server Component — يتحقق من الجلسة قبل عرض أي محتوى.
 * getUser() تعيد redirect تلقائياً إلى /login إذا لم تكن الجلسة صالحة.
 */
export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await getUser(); // throws redirect if not authenticated

  return (
    <div dir="rtl" className="flex h-dvh bg-[var(--background)]">
      {/* القسم الأول: Sidebar */}
      <Sidebar avatarUrl={user.avatar} userName={user.name ?? user.username} />

      {/* القسم الثاني + الثالث: Main + PhonePreview */}
      <div className="flex-1 min-w-0 flex gap-2 p-2 sm:ms-[82px] sm:m-2">
        <CollapsiblePhonePreview username={user.username}>
          {/* Card Container — flex-1 يجعله يملأ الفراغ المتبقي */}
          <div className="flex-1 min-w-0 relative h-full bg-white dark:bg-[var(--surface)] rounded-4xl border border-[var(--border)] overflow-clip">
            {/* Floating Nav */}
            <DashboardNav />

            {/* Scrollable content */}
            <main className="h-full overflow-y-auto overscroll-contain [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              <div className="mx-auto w-full max-w-7xl px-4 pt-14 pb-24 sm:pb-6 md:px-6">
                {children}
              </div>
            </main>
          </div>
        </CollapsiblePhonePreview>
      </div>

      {/* Mobile Dock — يظهر فقط على الهاتف */}
      <MobileDock />
    </div>
  );
}
