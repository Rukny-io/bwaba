'use client';

/**
 * 📱 Mobile Dock Navigation
 * شريط تنقل سفلي عائم للهاتف — dock مع drawer عامودي بتصميم بطاقات
 */

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutGrid,
  Link2,
  ShoppingBag,
  Palette,
  MoreHorizontal,
  X,
  ShoppingCart,
  PackageSearch,
  BarChart2,
  Truck,
  HelpCircle,
  Shield,
  Store,
  LogOut,
  Settings,
} from 'lucide-react';

/* ── Main dock items ── */

const dockItems = [
  {
    href: '/app',
    icon: LayoutGrid,
    label: 'الرئيسية',
    matchPaths: undefined as string[] | undefined,
  },
  { href: '/app/links', icon: Link2, label: 'الروابط', matchPaths: undefined },
  {
    href: '/app/store',
    icon: ShoppingBag,
    label: 'المتجر',
    matchPaths: ['/app/store', '/app/orders', '/app/products', '/app/analytics', '/app/shipping'],
  },
  { href: '/app/customize', icon: Palette, label: 'التخصيص', matchPaths: undefined },
];

/* ── More drawer items — 2 columns ── */

const moreItems = [
  { href: '/app/orders',   icon: ShoppingCart,  label: 'الطلبات',     desc: 'تتبع وإدارة طلبات العملاء'   },
  { href: '/app/products', icon: PackageSearch, label: 'المنتجات',    desc: 'إضافة وتعديل المنتجات'        },
  { href: '/app/analytics',icon: BarChart2,     label: 'التحليلات',   desc: 'إحصائيات ومؤشرات الأداء'      },
  { href: '/app/shipping', icon: Truck,          label: 'الشحن',       desc: 'إعدادات التوصيل والشحن'       },
  { href: '/app/store',    icon: Store,          label: 'لوحة المتجر', desc: 'إدارة شاملة لمتجرك'            },
  { href: '/app/settings', icon: Settings,       label: 'الإعدادات',   desc: 'تفضيلات الحساب والمتجر'       },
  { href: '/app/security', icon: Shield,         label: 'الأمان',      desc: 'كلمة المرور والحماية'          },
  { href: '/app/help',     icon: HelpCircle,     label: 'الدعم',       desc: 'مركز المساعدة والتواصل'        },
];

/* ── Helper ── */

function isItemActive(pathname: string, href: string, matchPaths?: string[]) {
  if (matchPaths) return matchPaths.some((p) => pathname === p || pathname.startsWith(p + '/'));
  if (href === '/app') return pathname === '/app';
  return pathname.startsWith(href);
}

/* ── Card stagger variants ── */

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05, delayChildren: 0.04 } },
  exit:    { transition: { staggerChildren: 0.02, staggerDirection: -1 as const } },
};

const cardVariants = {
  hidden:  { opacity: 0, y: 12, scale: 0.95 },
  visible: { opacity: 1, y: 0,  scale: 1,   transition: { duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] } },
  exit:    { opacity: 0, y: 8,  scale: 0.96, transition: { duration: 0.15 } },
};

/* ─────────────────────────────────────────
   Dock label: uses clip-path + width instead
   of maxWidth so it works on all mobile browsers
─────────────────────────────────────────── */
function DockLabel({ active, children }: { active: boolean; children: string }) {
  return (
    <motion.span
      animate={{
        width: active ? 72 : 0,
        opacity: active ? 1 : 0,
      }}
      transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] as [number,number,number,number] }}
      style={{
        display: 'inline-block',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        fontSize: '11.5px',
        fontWeight: '600',
        verticalAlign: 'middle',
        /* Framer handles width/opacity — no CSS transition needed */
      }}
    >
      {children}
    </motion.span>
  );
}



/* ── Component ── */

export function MobileDock() {
  const pathname = usePathname();
  const router   = useRouter();
  const [open, setOpen] = useState(false);

  async function handleLogout() {
    setOpen(false);
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  return (
    <>
      {/* ── Backdrop ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="backdrop"
            className="fixed inset-0 z-40 sm:hidden"
            style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(5px)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ── More Drawer ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="drawer"
            className="fixed bottom-[4.8rem] inset-x-3 z-50 sm:hidden rounded-3xl overflow-hidden"
            style={{
              background: 'rgba(12, 12, 18, 0.98)',
              backdropFilter: 'blur(28px)',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 -8px 48px rgba(0,0,0,0.6), 0 0 0 0.5px rgba(255,255,255,0.04)',
            }}
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0,  scale: 1    }}
            exit={{    opacity: 0, y: 24, scale: 0.96  }}
            transition={{ type: 'spring', stiffness: 400, damping: 32 }}
          >
            {/* ── Header ── */}
            <div className="flex items-center justify-between px-5 pt-5 pb-4" dir="rtl">
              <div>
                <p className="text-white text-[15px] font-bold tracking-tight">استكشاف</p>
                <p className="text-white/40 text-[12px] mt-0.5">جميع أقسام لوحة التحكم</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-full bg-white/8 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/15 transition-all duration-150"
              >
                <X size={14} strokeWidth={2.5} />
              </button>
            </div>

            <div className="mx-5 h-px bg-white/[0.07] mb-4" />

            {/* ── 2-Column Card Grid ── */}
            <motion.div
              className="grid grid-cols-2 gap-2.5 px-4 pb-4"
              dir="rtl"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {moreItems.map(({ href, icon: Icon, label, desc }) => {
                const active = isItemActive(pathname, href);
                return (
                  <motion.div key={href} variants={cardVariants}>
                    <Link
                      href={href}
                      onClick={() => setOpen(false)}
                      className={`flex flex-row items-center gap-3 px-3 py-3.5 rounded-2xl transition-all duration-150 border ${
                        active
                          ? 'bg-white/12 border-white/15'
                          : 'border-white/[0.07] hover:bg-white/6 hover:border-white/12'
                      }`}
                    >
                      {/* Icon bubble */}
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-150 ${
                          active ? 'bg-white/18 text-white' : 'bg-white/[0.07] text-white/60'
                        }`}
                      >
                        <Icon size={18} strokeWidth={active ? 2 : 1.6} />
                      </div>

                      {/* Text */}
                      <div className="min-w-0 flex-1">
                        <p
                          className={`text-[13px] font-semibold leading-tight ${
                            active ? 'text-white' : 'text-white/80'
                          }`}
                        >
                          {label}
                        </p>
                        <p className="text-[11px] text-white/35 mt-1 leading-snug line-clamp-2">
                          {desc}
                        </p>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </motion.div>

            {/* ── Logout ── */}
            <div className="px-4 pb-5">
              <div className="h-px bg-white/[0.07] mb-3" />
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-3.5 rounded-2xl text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-150 border border-white/[0.07] hover:border-red-500/20"
              >
                <div className="w-10 h-10 rounded-xl bg-red-500/12 flex items-center justify-center flex-shrink-0">
                  <LogOut size={17} strokeWidth={1.6} />
                </div>
                <div dir="rtl" className="text-right">
                  <p className="text-[13px] font-semibold">تسجيل الخروج</p>
                  <p className="text-[11px] text-red-400/50 mt-0.5">الخروج من حساب Rukny</p>
                </div>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Dock bar ── */}
      <div className="fixed bottom-0 inset-x-0 z-50 sm:hidden pointer-events-none pb-[env(safe-area-inset-bottom)]">

        {/* Gradient fade behind dock */}
        <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-[var(--background)] via-[var(--background)]/80 to-transparent" />

        <nav
          dir="rtl"
          className="relative mx-auto mb-3 w-fit flex items-center gap-1 px-2 py-2 rounded-[26px] pointer-events-auto"
          style={{
            background: 'rgba(12, 12, 18, 0.93)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.09)',
            boxShadow: '0 8px 40px rgba(0,0,0,0.4)',
          }}
          aria-label="Mobile navigation"
        >
          {/* Main nav items */}
          {dockItems.map(({ href, icon: Icon, label, matchPaths }) => {
            const isActive = isItemActive(pathname, href, matchPaths);
            return (
              <Link
                key={href}
                href={href}
                className="relative flex items-center justify-center"
                aria-label={label}
              >
                {/* Sliding pill — conditional layoutId */}
                {isActive && (
                  <motion.div
                    layoutId="dock-pill"
                    className="absolute inset-0 rounded-[20px]"
                    style={{ background: 'rgba(255,255,255,0.13)' }}
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}

                <div
                  className={`relative z-10 flex items-center gap-1.5 px-3 py-2.5 transition-colors duration-200 ${
                    isActive ? 'text-white' : 'text-white/35 hover:text-white/65'
                  }`}
                >
                  <Icon
                    size={19}
                    strokeWidth={isActive ? 2 : 1.4}
                    className="flex-shrink-0 transition-all duration-200"
                  />
                  {/* ✅ CSS-only label expand — works on all mobile browsers */}
                  <DockLabel active={isActive}>{label}</DockLabel>
                </div>
              </Link>
            );
          })}

          {/* Thin divider */}
          <div className="w-px h-5 bg-white/10 mx-0.5" />

          {/* More button */}
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label="المزيد"
            className="relative flex items-center justify-center"
          >
            {open && (
              <motion.div
                layoutId="dock-pill"
                className="absolute inset-0 rounded-[20px]"
                style={{ background: 'rgba(255,255,255,0.13)' }}
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
            <div
              className={`relative z-10 flex items-center justify-center px-3 py-2.5 transition-colors duration-200 ${
                open ? 'text-white' : 'text-white/35 hover:text-white/65'
              }`}
            >
              <motion.div
                animate={{ rotate: open ? 135 : 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 22 }}
              >
                <MoreHorizontal size={19} strokeWidth={open ? 2 : 1.4} />
              </motion.div>
            </div>
          </button>
        </nav>
      </div>
    </>
  );
}
