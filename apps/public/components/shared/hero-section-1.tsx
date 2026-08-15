'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowRight, ChevronDown, Menu, X, ShoppingBag, ClipboardList, UserCircle2, TrendingUp, BrainCircuit, LayoutGrid, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HeroSection as MarketingHero, LogosSection } from '@/components/ui/hero-1';
import { ParallaxScrolling } from '@/components/ui/parallax-scrolling';
import Footer from '@/components/layout/footer';
import { WhyChooseRuknySection } from '@/components/home/why-choose-rukny-section';
import { ConsultationCtaSection } from '@/components/home/consultation-cta-section';
import { cn } from '@/lib/utils';
import { siteUrls } from '@/lib/site-urls';
import type { Variants } from 'framer-motion';
import { motion, AnimatePresence } from 'framer-motion';

const transitionVariants = {
    item: {
        hidden: {
            opacity: 0,
            filter: 'blur(12px)',
            y: 12,
        },
        visible: {
            opacity: 1,
            filter: 'blur(0px)',
            y: 0,
            transition: {
                type: 'spring' as const,
                bounce: 0.3,
                duration: 1.5,
            },
        },
    },
} satisfies { item: Variants };

export function HeroSection() {
    return (
        <>
            <HeroHeader />
            <main className="min-h-screen overflow-x-clip pt-20 text-[#132327]" dir="rtl">
                <MarketingHero />
                <LogosSection />

                <ParallaxScrolling />

                <WhyChooseRuknySection />

                <ConsultationCtaSection />

                <Footer />
            </main>
        </>
    );
}

const BRAND = '#062c30';
const TEXT = '#132327';
const MUTED = 'rgba(19, 35, 39, 0.55)';
const BORDER = '#E8ECF0';
const SURFACE = '#F6F7F8';

const accountsUrl = siteUrls.accounts;

const NAV_LINK_CLASS =
    'relative z-10 cursor-pointer rounded-full px-3.5 py-2 text-[13.5px] font-medium text-[#132327]/70 transition-[color,transform] duration-200 hover:text-[#132327] active:scale-[0.98]';

const NAV_LINK_ACTIVE = 'text-[#132327]';

type NavIndicator = {
    left: number;
    width: number;
    opacity: number;
};

const menuItems = [
    { name: 'المطورين', href: '/developers' },
    { name: 'الأسعار', href: '/pricing' },
];

const productItems = [
    { name: 'المتاجر الإلكترونية', href: '/products/stores', icon: ShoppingBag, description: 'أنشئ متجرك وابدأ البيع فوراً' },
    { name: 'النماذج الذكية', href: '/products/forms', icon: ClipboardList, description: 'أنشئ نماذج واستبيانات متقدمة' },
    { name: 'الملف الشخصي', href: '/products/profile', icon: UserCircle2, description: 'صفحة شخصية احترافية لعملك' },
    { name: 'التحليلات', href: '/products/analytics', icon: TrendingUp, description: 'راقب أداء أعمالك بالتفصيل' },
    { name: 'الذكاء الاصطناعي', href: '/products/ai', icon: BrainCircuit, description: 'أدوات ذكية لتطوير أعمالك' },
    { name: 'Workspace', href: '/products/workspace', icon: Briefcase, description: 'أدر مشاريعك وفريقك من مكان واحد' },
] as const;

const PRODUCTS_MENU_CLOSE_DELAY = 160;

const HeroHeader = () => {
    const pathname = usePathname();
    const [menuState, setMenuState] = React.useState(false);
    const [isScrolled, setIsScrolled] = React.useState(false);
    const [productMenuOpen, setProductMenuOpen] = React.useState(false);
    const [navIndicator, setNavIndicator] = React.useState<NavIndicator>({
        left: 0,
        width: 0,
        opacity: 0,
    });
    const dropdownRef = React.useRef<HTMLDivElement>(null);
    const navPillRef = React.useRef<HTMLDivElement>(null);
    const navItemRefs = React.useRef<Map<string, HTMLElement>>(new Map());
    const closeMenuTimerRef = React.useRef<number | null>(null);

    const isNavActive = (href: string) =>
        href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);

    const clearCloseMenuTimer = React.useCallback(() => {
        if (closeMenuTimerRef.current !== null) {
            window.clearTimeout(closeMenuTimerRef.current);
            closeMenuTimerRef.current = null;
        }
    }, []);

    const openProductMenu = React.useCallback(() => {
        clearCloseMenuTimer();
        setProductMenuOpen(true);
    }, [clearCloseMenuTimer]);

    const scheduleCloseProductMenu = React.useCallback(() => {
        clearCloseMenuTimer();
        closeMenuTimerRef.current = window.setTimeout(() => {
            setProductMenuOpen(false);
        }, PRODUCTS_MENU_CLOSE_DELAY);
    }, [clearCloseMenuTimer]);

    React.useEffect(() => () => clearCloseMenuTimer(), [clearCloseMenuTimer]);

    React.useEffect(() => {
        const handleScroll = () => {
            const scrolled = window.scrollY > 48;
            setIsScrolled(scrolled);
            if (scrolled) setProductMenuOpen(false);
        };
        handleScroll();
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    React.useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setProductMenuOpen(false);
                setMenuState(false);
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, []);

    React.useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setProductMenuOpen(false);
            }
        };
        if (productMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [productMenuOpen]);

    React.useEffect(() => {
        setProductMenuOpen(false);
        setMenuState(false);
    }, [pathname]);

    const setNavItemRef = React.useCallback((key: string, node: HTMLElement | null) => {
        if (node) navItemRefs.current.set(key, node);
        else navItemRefs.current.delete(key);
    }, []);

    const updateNavIndicator = React.useCallback((key: string | null) => {
        const container = navPillRef.current;
        const target = key ? navItemRefs.current.get(key) : null;

        if (!container || !target) {
            setNavIndicator((prev) => ({ ...prev, opacity: 0 }));
            return;
        }

        const containerRect = container.getBoundingClientRect();
        const targetRect = target.getBoundingClientRect();

        setNavIndicator({
            left: targetRect.left - containerRect.left,
            width: targetRect.width,
            opacity: 1,
        });
    }, []);

    const getActiveNavKey = React.useCallback(() => {
        if (productMenuOpen) return 'products';
        if (isNavActive('/developers')) return '/developers';
        if (isNavActive('/pricing')) return '/pricing';
        return null;
    }, [pathname, productMenuOpen]);

    React.useEffect(() => {
        const syncIndicator = () => updateNavIndicator(getActiveNavKey());
        syncIndicator();
        window.addEventListener('resize', syncIndicator);
        return () => window.removeEventListener('resize', syncIndicator);
    }, [getActiveNavKey, updateNavIndicator]);

    // Lock body scroll when mobile menu is open
    React.useEffect(() => {
        document.body.style.overflow = menuState ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [menuState]);

    return (
        <header dir="rtl" className="relative">
            {/* Desktop — nav + dropdown mega menu */}
            <div className="fixed inset-x-0 top-0 z-50 hidden border-b border-transparent transition-all duration-300 lg:block">
                <div className="mx-auto max-w-6xl px-4 sm:px-6">
                    <div
                        ref={dropdownRef}
                        className="relative"
                        onMouseEnter={clearCloseMenuTimer}
                        onMouseLeave={scheduleCloseProductMenu}
                    >
                        <div className="flex h-14 items-center justify-between lg:grid lg:grid-cols-[1fr_auto_1fr] lg:gap-8">
                        <Link
                            href="/"
                            aria-label="الصفحة الرئيسية — Rukny"
                            className="group flex items-center gap-2.5 text-[#132327] transition-opacity hover:opacity-80"
                        >
                            <RuknyLogo />
                            <span className="text-[14px] font-bold tracking-[-0.02em] sm:text-[15px]">
                                Rukny
                            </span>
                        </Link>

                        <div
                            ref={navPillRef}
                            className={cn(
                                'group/nav relative isolate flex items-center justify-center gap-0.5 rounded-full p-1 transition-all duration-500',
                                isScrolled || productMenuOpen
                                    ? 'border border-[#132327]/[0.08] bg-white/88 shadow-[0_8px_32px_rgba(19,35,39,0.08),inset_0_1px_0_rgba(255,255,255,0.95)] backdrop-blur-xl'
                                    : 'border border-[#132327]/[0.08] bg-white/62 shadow-[0_2px_20px_rgba(19,35,39,0.06),inset_0_1px_0_rgba(255,255,255,0.92)] backdrop-blur-xl',
                            )}
                            onMouseLeave={() => updateNavIndicator(getActiveNavKey())}
                        >
                            <span
                                aria-hidden
                                className="pointer-events-none absolute inset-0 rounded-full bg-[linear-gradient(180deg,rgba(255,255,255,0.72)_0%,rgba(255,255,255,0.08)_100%)] opacity-80"
                            />
                            <span
                                aria-hidden
                                className="pointer-events-none absolute -inset-px rounded-full opacity-0 transition-opacity duration-500 group-hover/nav:opacity-100"
                                style={{
                                    background:
                                        'linear-gradient(135deg, rgba(6,44,48,0.12), rgba(19,35,39,0.04) 45%, rgba(255,255,255,0.35) 100%)',
                                    WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                                    WebkitMaskComposite: 'xor',
                                    maskComposite: 'exclude',
                                    padding: '1px',
                                }}
                            />
                            <motion.span
                                aria-hidden
                                className="pointer-events-none absolute top-1 bottom-1 rounded-full border border-[#132327]/[0.05] bg-[#132327]/[0.055] shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]"
                                animate={{
                                    left: navIndicator.left,
                                    width: navIndicator.width,
                                    opacity: navIndicator.opacity,
                                }}
                                transition={{ type: 'spring', stiffness: 420, damping: 34, mass: 0.75 }}
                            />
                            <button
                                ref={(node) => setNavItemRef('products', node)}
                                type="button"
                                aria-expanded={productMenuOpen}
                                aria-haspopup="true"
                                onMouseEnter={() => {
                                    updateNavIndicator('products');
                                    openProductMenu();
                                }}
                                onFocus={() => {
                                    updateNavIndicator('products');
                                    openProductMenu();
                                }}
                                onClick={() => setProductMenuOpen((open) => !open)}
                                className={cn(
                                    'flex items-center gap-1.5',
                                    NAV_LINK_CLASS,
                                    productMenuOpen && NAV_LINK_ACTIVE,
                                )}
                            >
                                <span>المنتجات</span>
                                <ChevronDown
                                    className={cn(
                                        'size-3.5 opacity-55 transition-transform duration-300 ease-out',
                                        productMenuOpen && 'rotate-180 opacity-80',
                                    )}
                                />
                            </button>
                            {menuItems.map((item) => (
                                <Link
                                    key={item.name}
                                    ref={(node) => setNavItemRef(item.href, node)}
                                    href={item.href}
                                    onMouseEnter={() => updateNavIndicator(item.href)}
                                    onFocus={() => updateNavIndicator(item.href)}
                                    className={cn(
                                        NAV_LINK_CLASS,
                                        isNavActive(item.href) && NAV_LINK_ACTIVE,
                                    )}
                                >
                                    {item.name}
                                </Link>
                            ))}
                        </div>

                        <div className="flex items-center justify-end gap-2">
                            <Link
                                href={accountsUrl}
                                className="hidden items-center rounded-full px-3.5 py-2 text-[13px] font-medium transition-all xl:inline-flex"
                                style={{ color: MUTED }}
                            >
                                تسجيل الدخول
                            </Link>
                            <Link
                                href={accountsUrl}
                                className="inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-[13px] font-semibold text-white shadow-[0_2px_10px_rgba(6,44,48,0.22)] transition-all hover:opacity-90 hover:shadow-[0_4px_16px_rgba(6,44,48,0.28)]"
                                style={{ backgroundColor: BRAND }}
                            >
                                <span>لوحة التحكم</span>
                                <LayoutGrid className="size-3.5 opacity-90" />
                            </Link>
                        </div>
                    </div>

                    <AnimatePresence>
                        {productMenuOpen && (
                            <>
                                <motion.div
                                    key="products-menu-backdrop"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.22 }}
                                    className="fixed inset-x-0 bottom-0 top-14 z-40 bg-[#132327]/[0.035] backdrop-blur-[1.5px]"
                                    aria-hidden
                                    onClick={() => setProductMenuOpen(false)}
                                />

                                <motion.div
                                    key="products-menu-panel"
                                    initial={{ opacity: 0, y: 14, scale: 0.985 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.99 }}
                                    transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                                    className="products-mega-menu absolute top-[calc(100%+0.4rem)] left-0 right-0 z-50"
                                    role="menu"
                                    aria-label="منتجات ركني"
                                >
                                    <div className="overflow-hidden rounded-[1.625rem] border border-[#132327]/[0.08] bg-white/96 shadow-[0_28px_90px_rgba(19,35,39,0.14),0_10px_30px_rgba(19,35,39,0.06),inset_0_1px_0_rgba(255,255,255,0.95)] backdrop-blur-2xl">
                                        <div className="grid lg:grid-cols-[1fr_18.5rem]">
                                            <div className="grid gap-2.5 p-3 sm:grid-cols-2 sm:p-4">
                                                {productItems.map((item, index) => {
                                                    const active = isNavActive(item.href);

                                                    return (
                                                        <motion.div
                                                            key={item.href}
                                                            initial={{ opacity: 0, y: 10 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            transition={{
                                                                delay: 0.04 + index * 0.045,
                                                                duration: 0.28,
                                                                ease: [0.22, 1, 0.36, 1],
                                                            }}
                                                        >
                                                            <Link
                                                                href={item.href}
                                                                role="menuitem"
                                                                className={cn(
                                                                    'products-mega-menu__item group relative flex h-full gap-3.5 overflow-hidden rounded-[1.125rem] border p-4 transition-all duration-300 sm:p-[1.125rem]',
                                                                    active
                                                                        ? 'border-[#062c30]/15 bg-white shadow-[0_10px_30px_rgba(6,44,48,0.08)]'
                                                                        : 'border-transparent bg-[#F6F7F8]/80 hover:-translate-y-0.5 hover:border-[#132327]/[0.08] hover:bg-[#FAFBFC] hover:shadow-[0_12px_32px_rgba(19,35,39,0.08)]',
                                                                )}
                                                                onClick={() => setProductMenuOpen(false)}
                                                            >
                                                                <span
                                                                    aria-hidden
                                                                    className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(238,242,242,0.95)_0%,rgba(255,255,255,0.98)_68%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                                                                />
                                                                <span
                                                                    className="relative flex size-11 shrink-0 items-center justify-center rounded-[0.9rem] bg-[#EEF2F2] text-[#062c30] transition-all duration-300 group-hover:scale-[1.05] group-hover:bg-[#E4ECEB]"
                                                                >
                                                                    <item.icon className="size-[19px]" strokeWidth={1.65} aria-hidden />
                                                                </span>
                                                                <div className="relative min-w-0 flex-1">
                                                                    <div className="flex items-start justify-between gap-2">
                                                                        <div>
                                                                            <p className="text-[10px] font-medium tracking-[0.12em] text-[#132327]/38">
                                                                                {String(index + 1).padStart(2, '0')}
                                                                            </p>
                                                                            <p className="mt-0.5 text-[14px] font-semibold leading-snug text-[#132327] transition-colors group-hover:text-[#062c30]">
                                                                                {item.name === 'Workspace' ? (
                                                                                    <span dir="ltr">{item.name}</span>
                                                                                ) : (
                                                                                    item.name
                                                                                )}
                                                                            </p>
                                                                        </div>
                                                                        <ArrowRight
                                                                            className="mt-1 size-3.5 shrink-0 rotate-180 text-[#132327]/35 opacity-0 transition-all duration-200 group-hover:-translate-x-0.5 group-hover:opacity-100"
                                                                            aria-hidden
                                                                        />
                                                                    </div>
                                                                    <p className="mt-1.5 text-[12px] leading-[1.65] text-[#132327]/55">
                                                                        {item.description}
                                                                    </p>
                                                                </div>
                                                            </Link>
                                                        </motion.div>
                                                    );
                                                })}
                                            </div>

                                            <div
                                                className="relative flex flex-col justify-between border-t px-5 py-5 sm:px-6 sm:py-6 lg:border-t-0 lg:border-r"
                                                style={{ borderColor: BORDER }}
                                            >
                                                <div
                                                    aria-hidden
                                                    className="pointer-events-none absolute inset-0 bg-[linear-gradient(165deg,#F9FBFB_0%,#EEF4F4_52%,#E8F0F0_100%)]"
                                                />
                                                <div
                                                    aria-hidden
                                                    className="pointer-events-none absolute -left-8 top-8 size-28 rounded-full bg-[#062c30]/[0.05] blur-2xl"
                                                />
                                                <div className="relative">
                                                    <p className="text-[11px] font-semibold tracking-[0.14em] text-[#132327]/42">
                                                        للمؤسسات
                                                    </p>
                                                    <h3 className="mt-2 text-[1.05rem] font-bold leading-snug tracking-[-0.02em] text-[#132327]">
                                                        مشروع خاص أو مؤسسة؟
                                                    </h3>
                                                    <p className="mt-2.5 text-[13px] leading-[1.75] text-[#132327]/58">
                                                        حلول مخصصة تناسب احتياجات فريقك — من التكامل إلى الدعم المباشر.
                                                    </p>
                                                    <ul className="mt-4 space-y-2 text-[12px] text-[#132327]/55">
                                                        {['تكاملات مخصصة', 'دعم مباشر', 'إعداد للفرق'].map((feature) => (
                                                            <li key={feature} className="flex items-center gap-2">
                                                                <span className="size-1.5 rounded-full bg-[#062c30]/35" />
                                                                {feature}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                                <div className="relative mt-6 space-y-2">
                                                    <Link
                                                        href="/contact"
                                                        className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-full text-[13px] font-semibold text-white shadow-[0_4px_16px_rgba(6,44,48,0.22)] transition-all hover:-translate-y-0.5 hover:opacity-95 hover:shadow-[0_8px_24px_rgba(6,44,48,0.28)]"
                                                        style={{ backgroundColor: BRAND }}
                                                        onClick={() => setProductMenuOpen(false)}
                                                    >
                                                        <span>احجز استشارة</span>
                                                        <ArrowRight className="size-3.5 rotate-180" />
                                                    </Link>
                                                    <Link
                                                        href="/pricing"
                                                        className="inline-flex h-9 w-full items-center justify-center rounded-full text-[12px] font-medium text-[#132327]/58 transition-colors hover:bg-white/70 hover:text-[#132327]"
                                                        onClick={() => setProductMenuOpen(false)}
                                                    >
                                                        أو اطّلع على الأسعار
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* Mobile nav */}
            <nav
                className={cn(
                    'fixed top-0 left-0 z-50 w-full border-b border-transparent transition-all duration-300 lg:hidden',
                    isScrolled || menuState ? 'py-2.5' : 'py-3',
                )}
            >
                <div className="mx-auto flex h-11 max-w-6xl items-center justify-between px-4 sm:px-6">
                    <Link
                        href="/"
                        aria-label="الصفحة الرئيسية — ركني"
                        className="flex items-center gap-2 text-[#132327]"
                        onClick={() => setMenuState(false)}
                    >
                        <RuknyLogo />
                        <span className="text-[14px] font-bold tracking-[-0.02em]">Rukny</span>
                    </Link>

                    <button
                        onClick={() => setMenuState(!menuState)}
                        aria-label={menuState ? 'إغلاق القائمة' : 'فتح القائمة'}
                        className="flex size-9 items-center justify-center rounded-xl text-[#132327] transition-colors hover:bg-[#132327]/[0.05] active:bg-[#132327]/[0.08]"
                    >
                        <AnimatePresence mode="wait">
                            {menuState ? (
                                <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                                    <X className="size-5" />
                                </motion.div>
                            ) : (
                                <motion.div key="menu" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
                                    <Menu className="size-5" />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </button>
                </div>
            </nav>

            {/* ─── Mobile Menu ─── */}
            <AnimatePresence>
                {menuState && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.25 }}
                            className="fixed inset-0 z-40 bg-[#132327]/20 backdrop-blur-sm lg:hidden"
                            onClick={() => setMenuState(false)}
                        />

                        {/* Sheet */}
                        <motion.div
                            initial={{ y: '-100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '-100%' }}
                            transition={{ type: 'spring', damping: 32, stiffness: 260 }}
                            drag="y"
                            dragConstraints={{ top: 0, bottom: 0 }}
                            dragElastic={{ top: 0, bottom: 0.35 }}
                            dragMomentum={false}
                            onDragEnd={(_, info) => {
                                if (info.offset.y > 80 || info.velocity.y > 300) setMenuState(false);
                            }}
                            className="fixed top-0 inset-x-0 z-50 flex max-h-[92dvh] flex-col rounded-b-[1.75rem] border-b bg-white/95 shadow-[0_20px_60px_rgba(19,35,39,0.12)] backdrop-blur-xl lg:hidden"
                            style={{ borderColor: BORDER, touchAction: 'pan-y' }}
                        >
                            {/* Drag handle */}
                            <div className="flex justify-center pt-3 pb-1 shrink-0">
                                <div className="w-9 h-1 rounded-full bg-muted-foreground/20" />
                            </div>

                            {/* Top bar */}
                            <div className="flex items-center justify-between px-5 pt-2 pb-4 shrink-0">
                                <RuknyLogo />
                                <button
                                    onClick={() => setMenuState(false)}
                                    className="flex size-9 items-center justify-center rounded-full transition-colors hover:bg-[#F6F7F8] active:scale-95"
                                >
                                    <X className="size-4" />
                                </button>
                            </div>

                            {/* Scrollable content */}
                            <div className="overflow-y-auto flex-1 px-4 pb-6 space-y-1">

                                {/* Section label */}
                                <p className="px-2 pb-2 pt-1 text-[11px] font-medium tracking-wide" style={{ color: MUTED }}>
                                    منتجات ركني
                                </p>

                                {/* Product list – single column for readability */}
                                {productItems.map((item, index) => (
                                    <motion.div
                                        key={item.name}
                                        initial={{ opacity: 0, x: 12 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.04, type: 'spring', stiffness: 300, damping: 28 }}
                                    >
                                            <Link
                                                href={item.href}
                                                className="group flex items-center gap-3.5 rounded-2xl px-3 py-3 transition-colors hover:bg-[#F6F7F8] active:bg-[#EEF0F2]"
                                                onClick={() => setMenuState(false)}
                                            >
                                            <div
                                                className="flex size-10 shrink-0 items-center justify-center rounded-xl"
                                                style={{ backgroundColor: SURFACE, color: BRAND }}
                                            >
                                                <item.icon className="size-[18px]" strokeWidth={1.6} aria-hidden />
                                            </div>
                                            <div className="min-w-0 flex-1 text-right">
                                                <p className="text-[14px] font-semibold leading-tight text-[#132327]">{item.name}</p>
                                                <p className="mt-0.5 text-[12px] leading-snug line-clamp-1" style={{ color: MUTED }}>
                                                    {item.description}
                                                </p>
                                            </div>
                                            <ChevronDown className="size-3.5 shrink-0 -rotate-90 opacity-40" />
                                        </Link>
                                    </motion.div>
                                ))}

                                {/* Divider */}
                                <div className="mx-2 my-3 h-px" style={{ backgroundColor: BORDER }} />

                                {/* Nav links row */}
                                <div className="grid grid-cols-2 gap-2 pt-1">
                                    {menuItems.map((item, index) => (
                                        <motion.div
                                            key={item.name}
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.05 + 0.28 }}
                                        >
                                            <Link
                                                href={item.href}
                                                className={cn(
                                                    'flex items-center justify-center rounded-2xl border py-3 text-[13px] font-medium transition-all active:scale-[0.98]',
                                                    isNavActive(item.href)
                                                        ? 'border-[#062c30]/20 bg-[#062c30]/[0.06] text-[#132327]'
                                                        : 'border-[#E8ECF0] bg-[#FAFBFC] text-[#132327] hover:bg-[#F6F7F8]',
                                                )}
                                                onClick={() => setMenuState(false)}
                                            >
                                                {item.name}
                                            </Link>
                                        </motion.div>
                                    ))}
                                </div>

                                <div className="h-px mx-2 my-3" style={{ backgroundColor: BORDER }} />

                                <div
                                    className="mx-2 mb-3 rounded-2xl border p-4"
                                    style={{ borderColor: BORDER, backgroundColor: '#FAFBFC' }}
                                >
                                    <p className="mb-1 text-[11px] font-medium" style={{ color: MUTED }}>
                                        للمؤسسات
                                    </p>
                                    <p className="text-[14px] font-semibold" style={{ color: TEXT }}>
                                        مشروع خاص أو مؤسسة؟
                                    </p>
                                    <p className="mt-1 text-[12px] leading-relaxed" style={{ color: MUTED }}>
                                        حلول مخصصة مع دعم مباشر لفريقك.
                                    </p>
                                    <Link
                                        href="/contact"
                                        className="mt-3 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-full text-[13px] font-semibold text-white"
                                        style={{ backgroundColor: BRAND }}
                                        onClick={() => setMenuState(false)}
                                    >
                                        احجز استشارة
                                        <ArrowRight className="size-3.5 rotate-180" />
                                    </Link>
                                </div>

                                {/* CTA Buttons */}
                                <motion.div
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.42 }}
                                    className="grid grid-cols-2 gap-3 pt-1"
                                >
                                    <Button asChild variant="outline" className="h-11 rounded-full border-[#E8ECF0] bg-white text-[13px] font-medium">
                                        <Link href={accountsUrl} onClick={() => setMenuState(false)}>
                                            تسجيل الدخول
                                        </Link>
                                    </Button>
                                    <Button
                                        asChild
                                        className="h-11 gap-2 rounded-full text-[13px] font-semibold text-white shadow-[0_2px_10px_rgba(6,44,48,0.2)]"
                                        style={{ backgroundColor: BRAND }}
                                    >
                                        <Link href={accountsUrl} onClick={() => setMenuState(false)}>
                                            <LayoutGrid className="size-4" />
                                            لوحة التحكم
                                        </Link>
                                    </Button>
                                </motion.div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </header>
    );
};

const RuknyLogo = ({ className }: { className?: string }) => {
    return (
        <div className={cn('flex items-center gap-2', className)}>
            <svg className="size-7" viewBox="0 0 1080 1080" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <rect x="352.46" y="211.99" width="411.5" height="239.89"/>
                <rect x="25" y="539.45" width="415.04" height="239.89" transform="translate(891.92 426.88) rotate(90)"/>
                <path d="m967.42,665.78v175.97c0,13.89-11.26,25.15-25.15,25.15h-190.54c-6.67,0-13.07-2.65-17.78-7.37l-141.2-141.2c-15.84-15.84-4.62-42.93,17.78-42.93h128.24c13.89,0,25.15-11.26,25.15-25.15v-137.68c0-22.41,27.09-33.63,42.93-17.78l153.21,153.21c4.72,4.72,7.37,11.11,7.37,17.78Z"/>
            </svg>
        </div>
    );
};

export { HeroHeader as MarketingHeader };
export default HeroSection;
