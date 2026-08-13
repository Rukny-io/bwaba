'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowRight, ChevronDown, Menu, X, ShoppingBag, ClipboardList, UserCircle2, TrendingUp, BrainCircuit, LayoutGrid } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LogoCloud } from '@/components/ui/logo-cloud';
import Footer from '@/components/layout/footer';
import { UnifiedPlatformSection } from '@/components/home/unified-platform-section';
import { AppPurposeSection } from '@/components/home/app-purpose-section';
import { WhyChooseRuknySection } from '@/components/home/why-choose-rukny-section';
import { FinalCtaSection } from '@/components/home/final-cta-section';
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

const rotatingItems = [
    { text: 'روابطك', color: '#FF2B3A' },
    { text: 'منتجاتك', color: '#FF2B3A' },
    { text: 'نماذجك', color: '#FF2B3A' },
    { text: 'إعلاناتك', color: '#FF2B3A' },
    { text: 'أعمالك', color: '#FF2B3A' },
];

const ITEM_H = 1.15;

function RotatingText() {
    const [index, setIndex] = React.useState(0);

    React.useEffect(() => {
        const timer = setInterval(() => {
            setIndex((prev) => (prev + 1) % rotatingItems.length);
        }, 2800);
        return () => clearInterval(timer);
    }, []);

    return (
        <span
            className="inline-block overflow-hidden align-bottom"
            style={{ height: `${ITEM_H}em` }}
        >
            <motion.span
                className="flex flex-col will-change-transform"
                animate={{ y: `-${index * ITEM_H}em` }}
                transition={{ duration: 0.55, ease: [0.32, 0.72, 0, 1] }}
            >
                {rotatingItems.map((item) => (
                    <span
                        key={item.text}
                        className="block shrink-0 font-bold"
                        style={{
                            height: `${ITEM_H}em`,
                            lineHeight: `${ITEM_H}em`,
                            color: item.color,
                        }}
                    >
                        {item.text}
                    </span>
                ))}
            </motion.span>
        </span>
    );
}

const trustedLogos = [
    { src: '/logos/tL_v571NdZ0.svg', alt: 'Meta' },
    { src: '/logos/facebook-wordmark.svg', alt: 'Facebook' },
    { src: '/logos/whatsapp-wordmark.svg', alt: 'WhatsApp' },
    { src: '/logos/instagram-wordmark.svg', alt: 'Instagram' },
    { src: '/logos/udemy.svg', alt: 'Udemy' },
    { src: '/logos/google-wordmark.svg', alt: 'Google' },
    { src: '/logos/gemini_wordmark.svg', alt: 'Gemini' },
    { src: '/logos/notion-full.svg', alt: 'Notion' },
    { src: '/logos/microsoft.svg', alt: 'Microsoft' },
];

export function HeroSection() {
    return (
        <>
            <HeroHeader />
            <main className="bg-white text-[#132327] min-h-screen" dir="rtl">
                <section className="relative overflow-hidden bg-white">
                    <div
                        className="pointer-events-none absolute inset-x-0 top-0 h-[min(520px,70vh)] bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(6,44,48,0.07),transparent)]"
                        aria-hidden
                    />
                    <div className="relative z-10 pt-8 sm:pt-10 md:pt-12 pb-10 sm:pb-14 md:pb-16">
                        <div className="mx-auto max-w-6xl px-4 sm:px-6">
                            <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-14 xl:gap-16">
                                {/* Right — heading */}
                                <div className="home-hero-enter flex-1 text-center lg:text-right">
                                    <h1 className="text-[2rem] sm:text-4xl md:text-5xl lg:text-[3.75rem] xl:text-[4.25rem] font-bold leading-[1.15] tracking-[-0.02em] text-[#132327]">
                                        <span className="block text-[1.125rem] sm:text-xl md:text-2xl font-semibold tracking-normal text-[#132327]/75" dir="ltr">
                                            Rukny Solutions
                                        </span>
                                        <span className="block mt-2">منصة رقمية</span>
                                        <span className="my-2 flex flex-wrap items-baseline justify-center gap-x-2 gap-y-1 sm:gap-3 lg:justify-end">
                                            <span>متكاملة لـ</span>
                                            <RotatingText />
                                        </span>
                                        <span className="block">على الانترنت</span>
                                    </h1>
                                </div>

                                {/* Left — badge, copy, CTA */}
                                <div className="home-hero-enter-delayed flex flex-1 flex-col gap-5 text-center sm:gap-6 lg:text-right">
                                    <span className="inline-flex w-fit items-center self-center rounded-full border border-[#132327]/15 px-4 py-1.5 text-[13px] font-medium text-[#132327]/70 lg:self-end">
                                        نسخة مستقرة
                                    </span>

                                    <p className="text-[15px] sm:text-base leading-[1.75] text-[#132327]/60">
                                        أطلق مشروعك على الانترنت خلال دقائق.
                                        أنشئ متجرك، أضف منتجاتك وروابطك ونماذجك،
                                        وتواصل مع عملائك — كل ذلك من لوحة تحكم واحدة.
                                    </p>

                                    <div className="flex flex-wrap justify-center gap-2 lg:justify-end">
                                        {heroTags.map((tag) => (
                                            <Link
                                                key={tag.label}
                                                href={tag.href}
                                                className="rounded-full border border-[#132327]/10 bg-white px-3.5 py-1 text-[12px] font-medium text-[#132327]/55 transition-colors hover:border-[#132327]/20 hover:bg-[#FAFBFC] hover:text-[#132327]/80"
                                            >
                                                {tag.label}
                                            </Link>
                                        ))}
                                    </div>

                                    <div className="flex flex-col items-center gap-3 pt-1 sm:flex-row sm:justify-center lg:justify-end">
                                        <Link
                                            href={siteUrls.accounts}
                                            className="inline-flex h-11 min-w-[9.5rem] items-center justify-center rounded-full px-7 text-[14px] font-semibold text-white shadow-[0_2px_10px_rgba(6,44,48,0.22)] transition-all hover:opacity-90 hover:shadow-[0_4px_16px_rgba(6,44,48,0.28)]"
                                            style={{ backgroundColor: BRAND }}
                                        >
                                            ابدأ مجاناً
                                        </Link>
                                        <Link
                                            href="/pricing"
                                            className="group inline-flex items-center gap-1 text-[14px] font-medium text-[#132327]/55 transition-colors hover:text-[#132327]"
                                        >
                                            <span>الأسعار</span>
                                            <ArrowRight className="size-3.5 rotate-180 transition-transform group-hover:-translate-x-0.5" />
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="home-hero-enter-delayed mx-auto max-w-6xl px-4 sm:px-6 mt-12 sm:mt-14 md:mt-16">
                            <div className="flex flex-col items-center justify-between gap-4 border-t border-[#E8ECF0] pt-5 text-center text-[13px] sm:flex-row sm:text-start sm:text-sm">
                                <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[#132327]/50 sm:justify-start">
                                    {['متاجر', 'روابط', 'نماذج', 'تحليلات'].map((item, i) => (
                                        <React.Fragment key={item}>
                                            <span>{item}</span>
                                            {i < 3 && (
                                                <span className="hidden size-1 rounded-full bg-[#132327]/15 sm:inline-block" />
                                            )}
                                        </React.Fragment>
                                    ))}
                                    <span className="font-semibold text-[#132327]">كلها في منصة واحدة</span>
                                </div>

                            </div>
                        </div>
                    </div>
                </section>

                <AppPurposeSection />
                <section className="relative w-full bg-white" aria-label="شركاء التقنية">
                    <div className="mx-auto w-full max-w-6xl px-4 pt-2 pb-4 sm:pb-5">
                        <p className="text-center text-[13px] font-medium text-[#132327]/55 sm:text-sm">
                            نعتمد على أحدث التقنيات من الشركات الرائدة
                        </p>
                    </div>

                    <div className="relative overflow-hidden border-y border-[#E8ECF0] bg-[#FAFBFC] py-5 sm:py-6" dir="ltr">
                        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-white to-transparent sm:w-28" />
                        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-white to-transparent sm:w-28" />

                        <LogoCloud logos={trustedLogos} />
                    </div>
                </section>

                <UnifiedPlatformSection />

                <WhyChooseRuknySection />

                <FinalCtaSection />

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

const heroTags = [
    { label: 'روابط', href: '#features' },
    { label: 'منتجات', href: '#features' },
    { label: 'نماذج', href: '#features' },
    { label: 'إعلانات', href: '#features' },
    { label: 'مطورين', href: '/developers' },
] as const;

const accountsUrl = siteUrls.accounts;

const NAV_LINK_CLASS =
    'cursor-pointer text-[14px] font-medium transition-all duration-200 text-[#132327]/75 hover:bg-[#132327]/[0.05] hover:text-[#132327]';

const NAV_LINK_ACTIVE =
    'bg-[#132327]/[0.07] text-[#132327]';

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
];

const HeroHeader = () => {
    const pathname = usePathname();
    const [menuState, setMenuState] = React.useState(false);
    const [isScrolled, setIsScrolled] = React.useState(false);
    const [productMenuOpen, setProductMenuOpen] = React.useState(false);
    const dropdownRef = React.useRef<HTMLDivElement>(null);

    const isNavActive = (href: string) =>
        href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);

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

    // Lock body scroll when mobile menu is open
    React.useEffect(() => {
        document.body.style.overflow = menuState ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [menuState]);

    return (
        <header dir="rtl" className="relative">
            {/* Desktop — nav + dropdown mega menu */}
            <div
                className={cn(
                    'fixed inset-x-0 top-0 z-50 hidden transition-all duration-300 lg:block',
                    isScrolled
                        ? 'border-b bg-white/78 backdrop-blur-xl'
                        : 'border-b border-transparent bg-transparent',
                )}
                style={{ borderColor: isScrolled ? BORDER : 'transparent' }}
            >
                <div className="mx-auto max-w-6xl px-4 sm:px-6">
                    <div
                        ref={dropdownRef}
                        className="relative"
                        onMouseLeave={() => setProductMenuOpen(false)}
                    >
                        <div className="flex h-14 items-center justify-between lg:grid lg:grid-cols-[1fr_auto_1fr] lg:gap-8">
                        <Link
                            href="/"
                            aria-label="الصفحة الرئيسية — Rukny Solutions"
                            className="group flex items-center gap-2.5 text-[#132327] transition-opacity hover:opacity-80"
                        >
                            <RuknyLogo />
                            <span className="text-[14px] font-bold tracking-[-0.02em] sm:text-[15px]">
                                Rukny Solutions
                            </span>
                        </Link>

                        <div
                            className={cn(
                                'flex items-center justify-center gap-0.5 rounded-full p-0.5 transition-all duration-300',
                                !isScrolled && !productMenuOpen
                                    ? 'border border-[#132327]/[0.07] bg-white/55 shadow-[0_2px_16px_rgba(19,35,39,0.05)] backdrop-blur-md'
                                    : 'border border-transparent bg-transparent',
                            )}
                        >
                            <div className="relative">
                                <button
                                    type="button"
                                    aria-expanded={productMenuOpen}
                                    aria-haspopup="true"
                                    onClick={() => setProductMenuOpen(!productMenuOpen)}
                                    className={cn(
                                        'flex items-center gap-1.5 rounded-full px-3.5 py-2 transition-all',
                                        productMenuOpen ? NAV_LINK_ACTIVE : NAV_LINK_CLASS,
                                    )}
                                >
                                    <span>المنتجات</span>
                                    <ChevronDown
                                        className={cn(
                                            'size-3.5 opacity-55 transition-transform duration-300',
                                            productMenuOpen && 'rotate-180',
                                        )}
                                    />
                                </button>
                            </div>
                            {menuItems.map((item) => (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={cn(
                                        'rounded-full px-3.5 py-2',
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
                                href={siteUrls.privacy}
                                className="hidden items-center rounded-full px-3 py-2 text-[12px] font-medium transition-all lg:inline-flex"
                                style={{ color: MUTED }}
                            >
                                Privacy
                            </Link>
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
                            <motion.div
                                initial={{ opacity: 0, y: -8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                                className="absolute top-full left-0 right-0 z-50 mt-2 overflow-hidden rounded-[1.75rem] border border-[#E8ECF0]/80 bg-white/95 shadow-[0_12px_40px_rgba(19,35,39,0.08)] backdrop-blur-xl"
                            >
                                <div
                                    className="flex items-center justify-between px-6 py-3.5 sm:px-7"
                                >
                                    <p className="text-[12px] font-medium" style={{ color: MUTED }}>
                                        منتجات ركني
                                    </p>
                                    <Link
                                        href="/products"
                                        className="group inline-flex items-center gap-1 text-[13px] font-medium transition-colors"
                                        style={{ color: MUTED }}
                                        onClick={() => setProductMenuOpen(false)}
                                    >
                                        <span className="group-hover:text-[#132327]">عرض الكل</span>
                                        <ArrowRight className="size-3.5 rotate-180 transition-transform group-hover:-translate-x-0.5" />
                                    </Link>
                                </div>

                                <div className="grid lg:grid-cols-[1fr_17.5rem]">
                                    <div className="grid gap-px sm:grid-cols-2" style={{ backgroundColor: BORDER }}>
                                        {productItems.map((item, index) => (
                                            <Link
                                                key={item.name}
                                                href={item.href}
                                                className={cn(
                                                    'group relative flex gap-3.5 bg-white px-5 py-4 transition-colors hover:bg-[#FAFBFC] sm:px-6 sm:py-5',
                                                    index === productItems.length - 1 && 'sm:col-span-2',
                                                )}
                                                onClick={() => setProductMenuOpen(false)}
                                            >
                                                <span
                                                    className="flex size-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-[1.04]"
                                                    style={{ backgroundColor: SURFACE, color: BRAND }}
                                                >
                                                    <item.icon className="size-[18px]" strokeWidth={1.6} aria-hidden />
                                                </span>
                                                <div className="min-w-0 flex-1">
                                                    <p className="mb-1 font-mono text-[10px] tracking-wide" style={{ color: MUTED }}>
                                                        {String(index + 1).padStart(2, '0')}
                                                    </p>
                                                    <p className="text-[14px] font-semibold leading-snug transition-colors group-hover:text-[#062c30]" style={{ color: TEXT }}>
                                                        {item.name}
                                                    </p>
                                                    <p className="mt-1 text-[12px] leading-relaxed" style={{ color: MUTED }}>
                                                        {item.description}
                                                    </p>
                                                </div>
                                                <ArrowRight
                                                    className="size-3.5 shrink-0 rotate-180 self-center opacity-0 transition-all duration-200 group-hover:-translate-x-0.5 group-hover:opacity-45"
                                                    style={{ color: MUTED }}
                                                    aria-hidden
                                                />
                                            </Link>
                                        ))}
                                    </div>

                                    <div
                                        className="flex flex-col justify-between border-t px-6 py-6 lg:border-t-0 lg:border-r"
                                        style={{ borderColor: BORDER, backgroundColor: '#FAFBFC' }}
                                    >
                                        <div>
                                            <p className="mb-2 text-[12px] font-medium" style={{ color: MUTED }}>
                                                للمؤسسات
                                            </p>
                                            <h3 className="text-[15px] font-bold leading-snug" style={{ color: TEXT }}>
                                                مشروع خاص أو مؤسسة؟
                                            </h3>
                                            <p className="mt-2 text-[13px] leading-[1.75]" style={{ color: MUTED }}>
                                                حلول مخصصة تناسب احتياجات فريقك — من التكامل إلى الدعم المباشر.
                                            </p>
                                        </div>
                                        <Link
                                            href="/contact"
                                            className="mt-6 inline-flex h-10 items-center justify-center gap-1.5 rounded-full text-[13px] font-semibold text-white shadow-[0_2px_10px_rgba(6,44,48,0.18)] transition-all hover:opacity-90"
                                            style={{ backgroundColor: BRAND }}
                                            onClick={() => setProductMenuOpen(false)}
                                        >
                                            <span>احجز استشارة</span>
                                            <ArrowRight className="size-3.5 rotate-180" />
                                        </Link>
                                        <Link
                                            href="/pricing"
                                            className="mt-2 inline-flex h-9 items-center justify-center text-[12px] font-medium transition-colors hover:text-[#132327]"
                                            style={{ color: MUTED }}
                                            onClick={() => setProductMenuOpen(false)}
                                        >
                                            أو اطّلع على الأسعار
                                        </Link>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* Mobile nav */}
            <nav
                className={cn(
                    'fixed top-0 left-0 z-50 w-full transition-all duration-300 lg:hidden',
                    isScrolled || menuState
                        ? 'border-b bg-white/90 py-2.5 shadow-[0_1px_0_rgba(19,35,39,0.04)] backdrop-blur-xl'
                        : 'border-b border-transparent bg-transparent py-3',
                )}
                style={{ borderColor: isScrolled || menuState ? BORDER : 'transparent' }}
            >
                <div className="mx-auto flex h-11 max-w-6xl items-center justify-between px-4 sm:px-6">
                    <Link
                        href="/"
                        aria-label="الصفحة الرئيسية — ركني"
                        className="flex items-center gap-2 text-[#132327]"
                        onClick={() => setMenuState(false)}
                    >
                        <RuknyLogo />
                        <span className="text-[14px] font-bold tracking-[-0.02em]">Rukny Solutions</span>
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
