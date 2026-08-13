"use client";

import Link from "next/link";
import {
  Mail,
  Store,
  FileText,
  User,
  BarChart3,
  Bot,
} from "lucide-react";

const Facebook = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
);
const Instagram = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
);
const Twitter = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
);
const Youtube = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"/><path d="m10 15 5-3-5-3z"/></svg>
);
const Linkedin = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>
);
import { cn } from "@/lib/utils";
import { siteUrls } from "@/lib/site-urls";

const footerConfig = {
  description:
    "Rukny (ركني) منصة عربية متكاملة تمكّنك من إنشاء صفحتك الاحترافية، إدارة متجرك الإلكتروني، وأنشاء نماذج ذكية بكل سهولة.",
  contact: {
    email: "support@rukny.io",
    phone: "+964 773 714 2672",
  },
  socials: [
    { icon: Facebook, href: "#", label: "فيسبوك" },
    { icon: Instagram, href: "#", label: "انستغرام" },
    { icon: Twitter, href: "#", label: "تويتر" },
    { icon: Youtube, href: "#", label: "يوتيوب" },
    { icon: Linkedin, href: "#", label: "لينكدإن" },
  ],
  products: [
    { label: "المتاجر الإلكترونية", href: "/products/stores", icon: Store },
    { label: "النماذج الذكية", href: "/products/forms", icon: FileText },
    { label: "الملف الشخصي", href: "/products/profile", icon: User },
    { label: "التحليلات", href: "/products/analytics", icon: BarChart3 },
    { label: "الذكاء الاصطناعي", href: "/products/ai", icon: Bot },
  ],
  columns: [
    {
      title: "الشركة",
      links: [
        { label: "من نحن", href: "/about" },
        { label: "الوظائف", href: "/careers" },
        { label: "المدونة", href: "/blog" },
        { label: "فريقنا", href: "/team" },
        { label: "تواصل معنا", href: "/contact" },
      ],
    },
    {
      title: "المنصة",
      links: [
        { label: "المميزات", href: "/features" },
        { label: "الأسعار", href: "/pricing" },
        { label: "التوثيق", href: "/docs" },
        { label: "واجهة API", href: "/api-docs" },
        { label: "التحديثات", href: "/updates" },
      ],
    },
    {
      title: "الموارد",
      links: [
        { label: "مركز المساعدة", href: "/help" },
        { label: "الأدلة والإرشادات", href: "/guides" },
        { label: "تتبع الطلب", href: "/track" },
        { label: "حالة النظام", href: "/status" },
        { label: "الأسئلة الشائعة", href: "/faq" },
      ],
    },
    {
      title: "القانونية",
      links: [
        { label: "سياسة الخصوصية", href: siteUrls.privacy },
        { label: "شروط الاستخدام", href: siteUrls.terms },
        { label: "الأمان و الأسترداد", href: "/security" },      ],
    },
  ],
};

const RuknyLogo = ({ className }: { className?: string }) => {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <svg className="size-7" viewBox="0 0 1080 1080" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <rect x="352.46" y="211.99" width="411.5" height="239.89"/>
        <rect x="25" y="539.45" width="415.04" height="239.89" transform="translate(891.92 426.88) rotate(90)"/>
        <path d="m967.42,665.78v175.97c0,13.89-11.26,25.15-25.15,25.15h-190.54c-6.67,0-13.07-2.65-17.78-7.37l-141.2-141.2c-15.84-15.84-4.62-42.93,17.78-42.93h128.24c13.89,0,25.15-11.26,25.15-25.15v-137.68c0-22.41,27.09-33.63,42.93-17.78l153.21,153.21c4.72,4.72,7.37,11.11,7.37,17.78Z"/>
      </svg>
      <span
        className="text-2xl font-bold"
        style={{ fontFamily: "var(--font-courgette), cursive" }}
      >
        Rukny
      </span>
    </div>
  );
};

export default function Footer() {
  return (
    <footer
      dir="rtl"
      className="bg-white dark:bg-black text-black dark:text-white px-4 sm:px-6 py-12 sm:py-16 border-t border-gray-200 dark:border-gray-800"
    >
      <div className="max-w-7xl mx-auto">
        {/* Top Section: Logo and Description */}
        <div className="mb-10 sm:mb-12">
          <div className="mb-6">
            <RuknyLogo />
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed max-w-2xl">
            {footerConfig.description}
          </p>
        </div>

        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-10 lg:gap-8">
          {/* Right Side (RTL): Links */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8 flex-1">
            {footerConfig.columns.map((col, idx) => (
              <div key={idx}>
                <h3 className="text-sm font-semibold mb-4">{col.title}</h3>
                <ul className="space-y-3">
                  {col.links.map((link, i) => (
                    <li key={i}>
                      <Link
                        href={link.href}
                        className="text-sm text-gray-600 dark:text-gray-300 hover:text-primary transition-colors"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Social Links */}
        <div className="mt-10 pt-8 border-t border-gray-200 dark:border-gray-800">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">تابعنا على:</span>
              <div className="flex gap-3">
                {footerConfig.socials.map(({ icon: Icon, href, label }, idx) => (
                  <Link
                    key={idx}
                    href={href}
                    aria-label={label}
                    className="size-9 rounded-full bg-muted/50 flex items-center justify-center text-gray-500 hover:text-primary hover:bg-primary/10 transition-all"
                  >
                    <Icon className="size-4" />
                  </Link>
                ))}
              </div>
            </div>

            {/* Contact Info */}
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <a
                href={`mailto:${footerConfig.contact.email}`}
                className="flex items-center gap-2 hover:text-primary transition-colors"
              >
                <Mail className="size-4" />
                {footerConfig.contact.email}
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row justify-between items-center text-xs text-gray-500 dark:text-gray-400 gap-4">
          <p>© {new Date().getFullYear()} Rukny. جميع الحقوق محفوظة.</p>
          <div className="flex gap-6">
            <a href={siteUrls.privacy} className="hover:text-primary transition-colors">
              الخصوصية
            </a>
            <a href={siteUrls.terms} className="hover:text-primary transition-colors">
              الشروط
            </a>
            <Link href="/sitemap" className="hover:text-primary transition-colors">
              خريطة الموقع
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export { Footer };
