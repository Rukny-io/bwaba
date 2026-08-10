import { siteUrls } from '@/lib/site-urls';
import { PUBLIC_SITE_URL } from '@/lib/config';

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__brand">
          <p className="site-footer__title">Rukny</p>
          <p className="site-footer__tagline">
            منصة عربية لبناء النماذج الرقمية وإدارة الاستجابات.
          </p>
        </div>

        <div className="site-footer__links">
          <a href="/pricing" className="site-footer__link">
            الأسعار
          </a>
          <span className="site-footer__sep" aria-hidden>
            |
          </span>
          <a href={siteUrls.privacy} className="site-footer__link">
            سياسة الخصوصية
          </a>
          <span className="site-footer__sep" aria-hidden>
            |
          </span>
          <a href={siteUrls.terms} className="site-footer__link">
            شروط الاستخدام
          </a>
          <span className="site-footer__sep" aria-hidden>
            |
          </span>
          <a href={siteUrls.forms} className="site-footer__link">
            لوحة النماذج
          </a>
        </div>

        <p className="site-footer__legal" lang="en">
          © {new Date().getFullYear()} Rukny.io — Privacy Policy:{' '}
          <a href={`${PUBLIC_SITE_URL}/privacy`}>{PUBLIC_SITE_URL}/privacy</a>
        </p>
      </div>
    </footer>
  );
}
