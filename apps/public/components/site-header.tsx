import Link from 'next/link';
import { siteUrls } from '@/lib/site-urls';
import { RuknyLogo } from '@/components/rukny-logo';

const navLinks = [
  { href: '/pricing', label: 'الأسعار', external: false },
  { href: siteUrls.forms, label: 'النماذج', external: true },
  { href: siteUrls.privacy, label: 'سياسة الخصوصية', external: false },
  { href: siteUrls.terms, label: 'شروط الاستخدام', external: false },
] as const;

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link href="/" className="site-header__brand">
          <RuknyLogo className="h-8 w-8" />
          <span>Rukny</span>
        </Link>

        <nav className="site-header__nav" aria-label="التنقل الرئيسي">
          {navLinks.map((item) =>
            item.external ? (
              <a
                key={item.href}
                href={item.href}
                className="site-header__link"
                rel="noopener noreferrer"
              >
                {item.label}
              </a>
            ) : (
              <Link key={item.href} href={item.href} className="site-header__link">
                {item.label}
              </Link>
            ),
          )}
        </nav>
      </div>
    </header>
  );
}
