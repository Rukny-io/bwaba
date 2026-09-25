'use client';

import Link from 'next/link';
import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { SUPPORT_FAQS } from '@/lib/public-marketing-pages';
import { agLayout } from '@/lib/public-antigravity-theme';
import { siteUrls } from '@/lib/site-urls';
import { cn } from '@/lib/utils';

const EASE = [0.16, 1, 0.3, 1] as const;
const CONTACT_EMAIL = 'support@rukny.io';

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-[#EBEBEB] last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 py-4 text-start sm:py-5"
      >
        <span className="text-[14px] font-medium text-[#1D1D1D] sm:text-[15px]">
          {question}
        </span>
        <ChevronDown
          className={cn(
            'size-4 shrink-0 text-[#9CA3AF] transition-transform duration-300',
            open && 'rotate-180',
          )}
          aria-hidden
        />
      </button>
      <div
        className={cn(
          'grid transition-all duration-300',
          open ? 'grid-rows-[1fr] pb-4 opacity-100 sm:pb-5' : 'grid-rows-[0fr] opacity-0',
        )}
      >
        <div className="overflow-hidden">
          <p className="text-start text-[13px] leading-relaxed text-[#6B6F76] sm:text-sm">
            {answer}
          </p>
        </div>
      </div>
    </div>
  );
}

export function PublicAgSupportView() {
  const reduceMotion = useReducedMotion();

  return (
    <div className={`${agLayout.container} pb-16 pt-10 sm:pb-20 sm:pt-14 md:pt-16`}>
      <motion.header
        className="mx-auto max-w-3xl text-center"
        initial={reduceMotion ? false : { opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: EASE }}
      >
        <p className={agLayout.eyebrow}>الدعم</p>
        <h1 className={`${agLayout.sectionTitle} mt-4`}>
          كيف يمكننا
          <span className="text-[#9CA3AF]"> مساعدتك؟</span>
        </h1>
        <p className={`${agLayout.lead} mx-auto mt-5 max-w-2xl`}>
          إجابات سريعة، روابط مفيدة، وقناة تواصل مباشرة مع فريق ركني.
        </p>
      </motion.header>

      <div className="mx-auto mt-10 grid max-w-4xl gap-4 sm:mt-12 sm:grid-cols-3">
        {[
          { title: 'الوثائق', href: '/docs', text: 'أدلة البدء لكل منتج' },
          { title: 'الأسعار', href: '/pricing', text: 'الباقات والأسئلة الشائعة' },
          { title: 'المؤسسات', href: '/enterprise', text: 'حلول للفرق والشركات' },
        ].map((item) => (
          <Link
            key={item.title}
            href={item.href}
            className="rounded-[2rem] bg-[#FAFAFA] p-6 text-start transition-colors hover:bg-[#F5F5F5] sm:p-7"
          >
            <p className="text-[1rem] font-medium text-[#1D1D1D]">{item.title}</p>
            <p className="mt-2 text-[13px] leading-relaxed text-[#6B6F76]">{item.text}</p>
          </Link>
        ))}
      </div>

      <section className="mt-14 sm:mt-20" aria-labelledby="support-faq-heading">
        <div className="mb-6 text-center sm:mb-8">
          <p className={agLayout.eyebrow}>مساعدة</p>
          <h2 id="support-faq-heading" className={`${agLayout.sectionTitle} mt-4 text-xl sm:text-2xl`}>
            الأسئلة الشائعة
          </h2>
        </div>
        <div className="mx-auto max-w-2xl overflow-hidden rounded-[2rem] bg-[#FAFAFA] px-4 sm:px-6">
          {SUPPORT_FAQS.map((faq) => (
            <FaqItem key={faq.question} question={faq.question} answer={faq.answer} />
          ))}
        </div>
      </section>

      <div className="mx-auto mt-12 max-w-4xl rounded-[2rem] bg-[#1D1D1D] p-8 text-white sm:mt-16 sm:p-10">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div className="text-start">
            <p className="text-[12px] font-medium tracking-[0.14em] text-white/55">تواصل مباشر</p>
            <h2 className="mt-3 text-[1.35rem] font-medium tracking-[-0.02em]">
              ما زلت بحاجة للمساعدة؟
            </h2>
            <p className="mt-2 text-[14px] leading-[1.8] text-white/70">
              راسلنا على {CONTACT_EMAIL} — نرد خلال يوم عمل.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="inline-flex h-11 items-center justify-center rounded-full bg-white px-6 text-[14px] font-medium text-[#1D1D1D]"
            >
              راسل الدعم
            </a>
            <Link
              href={siteUrls.accounts}
              className="inline-flex h-11 items-center justify-center rounded-full bg-white/10 px-6 text-[14px] font-medium text-white"
            >
              ابدأ مجاناً
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
