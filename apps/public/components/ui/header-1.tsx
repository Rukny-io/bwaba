'use client';

import React from 'react';
import Link from 'next/link';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { MenuToggleIcon } from '@/components/ui/menu-toggle-icon';
import { useScroll } from '@/components/ui/use-scroll';
import { createPortal } from 'react-dom';
import { RuknyLogo } from '@/components/rukny-logo';
import { siteUrls } from '@/lib/site-urls';

export function Header() {
  const [open, setOpen] = React.useState(false);
  const scrolled = useScroll(10);

  const links = [
    { label: 'الأسعار', href: '/pricing' },
    { label: 'المطورين', href: '/developers' },
    { label: 'المنتجات', href: '/#features' },
  ];

  React.useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <header
      className={cn('sticky top-0 z-50 w-full border-b border-transparent', {
        'border-border bg-background/95 backdrop-blur-lg supports-[backdrop-filter]:bg-background/50':
          scrolled,
      })}
      dir="rtl"
    >
      <nav className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4">
        <Link href="/" className="rounded-md p-2 hover:bg-accent">
          <RuknyLogo className="h-5 w-auto text-[#062c30]" />
        </Link>

        <div className="hidden items-center gap-2 md:flex">
          {links.map((link) => (
            <Link key={link.label} className={buttonVariants({ variant: 'ghost' })} href={link.href}>
              {link.label}
            </Link>
          ))}
          <Button variant="outline" asChild>
            <Link href={siteUrls.login}>تسجيل الدخول</Link>
          </Button>
          <Button asChild>
            <Link href={siteUrls.accounts}>ابدأ مجاناً</Link>
          </Button>
        </div>

        <Button
          size="icon"
          variant="outline"
          onClick={() => setOpen(!open)}
          className="md:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label="Toggle menu"
        >
          <MenuToggleIcon open={open} className="size-5" duration={300} />
        </Button>
      </nav>

      <MobileMenu open={open} className="flex flex-col justify-between gap-2">
        <div className="grid gap-y-2">
          {links.map((link) => (
            <Link
              key={link.label}
              className={buttonVariants({ variant: 'ghost', className: 'justify-start' })}
              href={link.href}
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </div>
        <div className="flex flex-col gap-2">
          <Button variant="outline" className="w-full bg-transparent" asChild>
            <Link href={siteUrls.login}>تسجيل الدخول</Link>
          </Button>
          <Button className="w-full" asChild>
            <Link href={siteUrls.accounts}>ابدأ مجاناً</Link>
          </Button>
        </div>
      </MobileMenu>
    </header>
  );
}

type MobileMenuProps = React.ComponentProps<'div'> & {
  open: boolean;
};

function MobileMenu({ open, children, className, ...props }: MobileMenuProps) {
  if (!open || typeof window === 'undefined') return null;

  return createPortal(
    <div
      id="mobile-menu"
      className={cn(
        'fixed inset-x-0 bottom-0 top-14 z-40 flex flex-col overflow-hidden border-y border-border bg-background/95 backdrop-blur-lg supports-[backdrop-filter]:bg-background/50 md:hidden',
      )}
    >
      <div
        data-slot={open ? 'open' : 'closed'}
        className={cn('size-full p-4', className)}
        {...props}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}
