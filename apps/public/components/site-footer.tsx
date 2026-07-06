import { siteUrls } from '@/lib/site-urls';

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
          <a href={siteUrls.privacy}>{siteUrls.privacy}</a>
        </p>
      </div>
    </footer>
  );
}
