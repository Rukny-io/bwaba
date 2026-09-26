'use client';

import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import {
  motion,
  useInView,
  useReducedMotion,
  type Variants,
} from 'framer-motion';
import {
  CheckCircle2,
  CreditCard,
  Package,
  ShoppingBag,
  UserPlus,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { agLayout, productTints } from '@/lib/public-antigravity-theme';
import { cn } from '@/lib/utils';

const EASE = [0.16, 1, 0.3, 1] as const;

const STEP_ICONS = [UserPlus, Package, ShoppingBag, CreditCard] as const;

const STAGGER_CHILDREN: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1, delayChildren: 0.05 },
  },
};

const FADE_UP: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: EASE },
  },
};

const POP_IN: Variants = {
  hidden: { opacity: 0, scale: 0.88 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.4, ease: EASE },
  },
};

function LatinNumerals({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span dir="ltr" lang="en" className={cn('tabular-nums', className)}>
      {children}
    </span>
  );
}

function useVisualInView(amount = 0.55) {
  const ref = useRef<HTMLDivElement>(null);
  const active = useInView(ref, { amount, once: false });
  return { ref, active };
}

function useTypewriter(text: string, active: boolean, speed = 42) {
  const reduceMotion = useReducedMotion();
  const [value, setValue] = useState(reduceMotion ? text : '');

  useEffect(() => {
    if (reduceMotion || !active) {
      setValue(text);
      return;
    }

    setValue('');
    let index = 0;
    const timer = window.setInterval(() => {
      index += 1;
      setValue(text.slice(0, index));
      if (index >= text.length) window.clearInterval(timer);
    }, speed);

    return () => window.clearInterval(timer);
  }, [active, reduceMotion, speed, text]);

  return value;
}

function RegisterVisual({
  storeName,
  storeNameValue,
  emailLabel,
  cta,
}: {
  storeName: string;
  storeNameValue: string;
  emailLabel: string;
  cta: string;
}) {
  const reduceMotion = useReducedMotion();
  const { ref, active } = useVisualInView();
  const typedName = useTypewriter(storeNameValue, active);

  return (
    <div ref={ref}>
      <motion.div
        className="space-y-3"
        variants={STAGGER_CHILDREN}
        initial="hidden"
        animate={active ? 'visible' : 'hidden'}
      >
        <motion.div variants={FADE_UP} className="rounded-xl bg-white/80 px-3 py-2.5">
          <p className="text-[10px] font-medium text-[#9CA3AF]">{storeName}</p>
          <p className="mt-1 min-h-[1.25rem] text-[13px] font-medium text-[#1D1D1D]">
            {typedName}
            {!reduceMotion && active && typedName.length < storeNameValue.length ? (
              <motion.span
                className="ms-0.5 inline-block h-[0.85em] w-px bg-[#1D1D1D]"
                animate={{ opacity: [1, 0, 1] }}
                transition={{ duration: 0.8, repeat: Infinity }}
                aria-hidden
              />
            ) : null}
          </p>
        </motion.div>
        <motion.div variants={FADE_UP} className="rounded-xl bg-white/80 px-3 py-2.5">
          <p className="text-[10px] font-medium text-[#9CA3AF]">{emailLabel}</p>
          <motion.p
            className="mt-1 text-[13px] text-[#6B6F76]"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={active ? { opacity: 1 } : { opacity: 0 }}
            transition={{ delay: 0.35, duration: 0.35 }}
          >
            merchant@example.com
          </motion.p>
        </motion.div>
        <motion.div
          variants={POP_IN}
          className="rounded-full bg-[#1D1D1D] px-4 py-2 text-center text-[12px] font-medium text-white"
          animate={
            reduceMotion || !active
              ? undefined
              : {
                  scale: [1, 1.02, 1],
                  boxShadow: [
                    '0 0 0 rgba(29,29,29,0)',
                    '0 8px 20px rgba(29,29,29,0.12)',
                    '0 0 0 rgba(29,29,29,0)',
                  ],
                }
          }
          transition={{ delay: 0.55, duration: 0.7, ease: EASE }}
        >
          {cta}
        </motion.div>
      </motion.div>
    </div>
  );
}

function ProductsVisual({
  products,
}: {
  products: Array<{ name: string; price: string }>;
}) {
  const reduceMotion = useReducedMotion();
  const { ref, active } = useVisualInView();

  return (
    <div ref={ref}>
      <motion.div
        className="grid grid-cols-3 gap-2"
        variants={STAGGER_CHILDREN}
        initial="hidden"
        animate={active ? 'visible' : 'hidden'}
      >
        {products.map((product, index) => (
          <motion.div
            key={product.name}
            variants={POP_IN}
            animate={
              reduceMotion || !active
                ? undefined
                : {
                    y: [0, index === 1 ? -3 : -2, 0],
                  }
            }
            transition={{
              delay: 0.2 + index * 0.12,
              duration: 2.4,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="overflow-hidden rounded-xl bg-white/80 text-center"
          >
            <motion.div
              className="aspect-square bg-[#F5F5F5]"
              initial={reduceMotion ? false : { scaleY: 0 }}
              animate={active ? { scaleY: 1 } : { scaleY: 0 }}
              transition={{ delay: 0.1 + index * 0.08, duration: 0.35, ease: EASE }}
              style={{ originY: 1 }}
            />
            <div className="px-1.5 py-2">
              <p className="truncate text-[10px] font-medium text-[#1D1D1D]">
                {product.name}
              </p>
              <p className="mt-0.5 text-[9px] text-[#6B6F76]">
                <LatinNumerals>{product.price}</LatinNumerals>
              </p>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

function OrderVisual({
  orderLabel,
  orderNumber,
  product,
  status,
}: {
  orderLabel: string;
  orderNumber: string;
  product: string;
  status: string;
}) {
  const reduceMotion = useReducedMotion();
  const { ref, active } = useVisualInView();

  return (
    <div ref={ref}>
      <motion.div
        className="rounded-xl bg-white/80 p-3"
        initial={reduceMotion ? false : { opacity: 0, x: 16 }}
        animate={active ? { opacity: 1, x: 0 } : { opacity: 0, x: 16 }}
        transition={{ duration: 0.45, ease: EASE }}
      >
        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] font-medium text-[#1D1D1D]">
            {orderLabel}{' '}
            <LatinNumerals>{orderNumber}</LatinNumerals>
          </p>
          <motion.span
            className="relative rounded-full bg-[#FFF7ED] px-2 py-0.5 text-[9px] font-medium text-[#C2410C]"
            animate={
              reduceMotion || !active
                ? undefined
                : { scale: [1, 1.04, 1] }
            }
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          >
            {!reduceMotion && active ? (
              <motion.span
                className="pointer-events-none absolute inset-0 rounded-full bg-[#FDBA74]/35"
                animate={{ scale: [1, 1.35], opacity: [0.45, 0] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut' }}
                aria-hidden
              />
            ) : null}
            {status}
          </motion.span>
        </div>
        <motion.div
          className="mt-3 flex items-center gap-2.5"
          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
          animate={active ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
          transition={{ delay: 0.15, duration: 0.4, ease: EASE }}
        >
          <div className="size-9 shrink-0 rounded-lg bg-[#F5F5F5]" />
          <div className="min-w-0">
            <p className="truncate text-[12px] font-medium text-[#1D1D1D]">{product}</p>
            <p className="mt-0.5 text-[10px] text-[#9CA3AF]">
              <LatinNumerals>× 1</LatinNumerals>
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

function PaymentVisual({
  paidLabel,
  amount,
  method,
}: {
  paidLabel: string;
  amount: string;
  method: string;
}) {
  const reduceMotion = useReducedMotion();
  const { ref, active } = useVisualInView();

  return (
    <div ref={ref}>
      <motion.div
        className="relative overflow-hidden rounded-xl bg-white/80 p-3 text-center"
        initial={reduceMotion ? false : { opacity: 0, scale: 0.94 }}
        animate={active ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.94 }}
        transition={{ duration: 0.45, ease: EASE }}
      >
        {!reduceMotion && active ? (
          <>
            <motion.span
              className="pointer-events-none absolute left-1/2 top-8 size-16 -translate-x-1/2 rounded-full border border-[#16A34A]/20"
              animate={{ scale: [0.7, 1.35], opacity: [0.5, 0] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
              aria-hidden
            />
            <motion.span
              className="pointer-events-none absolute left-1/2 top-8 size-16 -translate-x-1/2 rounded-full border border-[#16A34A]/15"
              animate={{ scale: [0.7, 1.55], opacity: [0.35, 0] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut', delay: 0.35 }}
              aria-hidden
            />
          </>
        ) : null}

        <motion.div
          className="relative mx-auto flex size-10 items-center justify-center rounded-full bg-[#ECFDF5]"
          initial={reduceMotion ? false : { scale: 0 }}
          animate={active ? { scale: 1 } : { scale: 0 }}
          transition={{ type: 'spring', stiffness: 320, damping: 18, delay: 0.05 }}
        >
          <motion.div
            initial={reduceMotion ? false : { scale: 0, rotate: -20 }}
            animate={active ? { scale: 1, rotate: 0 } : { scale: 0, rotate: -20 }}
            transition={{ type: 'spring', stiffness: 360, damping: 16, delay: 0.12 }}
          >
            <CheckCircle2 className="size-5 text-[#16A34A]" strokeWidth={2} />
          </motion.div>
        </motion.div>
        <motion.p
          className="mt-3 text-[12px] font-medium text-[#1D1D1D]"
          initial={reduceMotion ? false : { opacity: 0, y: 6 }}
          animate={active ? { opacity: 1, y: 0 } : { opacity: 0, y: 6 }}
          transition={{ delay: 0.2, duration: 0.35 }}
        >
          {paidLabel}
        </motion.p>
        <motion.p
          className="mt-1 text-[15px] font-medium text-[#1D1D1D]"
          initial={reduceMotion ? false : { opacity: 0, y: 8 }}
          animate={active ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
          transition={{ delay: 0.28, duration: 0.35 }}
        >
          <LatinNumerals>{amount}</LatinNumerals>
        </motion.p>
        <motion.p
          className="mt-2 text-[10px] text-[#9CA3AF]"
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={active ? { opacity: 1 } : { opacity: 0 }}
          transition={{ delay: 0.38, duration: 0.35 }}
        >
          {method}
        </motion.p>
      </motion.div>
    </div>
  );
}

function JourneyStepCard({
  index,
  icon: Icon,
  title,
  description,
  visual,
  reduceMotion,
}: {
  index: number;
  icon: typeof UserPlus;
  title: string;
  description: string;
  visual: ReactNode;
  reduceMotion: boolean | null;
}) {
  return (
    <motion.article
      initial={reduceMotion ? false : { opacity: 0, y: 28 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6, delay: index * 0.1, ease: EASE }}
      whileHover={reduceMotion ? undefined : { y: -6, transition: { duration: 0.25 } }}
      className={cn(
        'flex flex-col rounded-[2rem] p-5 sm:p-6',
        productTints.stores,
      )}
    >
      <div className="flex items-center gap-3">
        <motion.div
          initial={reduceMotion ? false : { scale: 0.8, opacity: 0 }}
          whileInView={reduceMotion ? undefined : { scale: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: index * 0.08, ease: EASE }}
        >
          <LatinNumerals
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/80 text-[12px] font-medium text-[#6B6F76]"
          >
            {String(index + 1).padStart(2, '0')}
          </LatinNumerals>
        </motion.div>
        <motion.div
          className="flex size-9 items-center justify-center rounded-xl bg-white/80"
          initial={reduceMotion ? false : { rotate: -8, opacity: 0 }}
          whileInView={reduceMotion ? undefined : { rotate: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.05 + index * 0.08 }}
          whileHover={reduceMotion ? undefined : { rotate: 6, scale: 1.05 }}
        >
          <Icon className="size-4 text-[#1D1D1D]/70" strokeWidth={1.5} />
        </motion.div>
      </div>

      <h3 className="mt-5 text-[1rem] font-medium tracking-[-0.02em] text-[#1D1D1D]">
        {title}
      </h3>
      <p className="mt-2 flex-1 text-[13px] leading-[1.75] text-[#6B6F76]">{description}</p>

      <div className="mt-5">{visual}</div>
    </motion.article>
  );
}

export function PublicAgStoreJourney({
  variant = 'embedded',
}: {
  variant?: 'embedded' | 'page';
}) {
  const t = useTranslations('products.pages.stores.journey');
  const reduceMotion = useReducedMotion();

  const steps = [
    {
      key: 'register',
      visual: (
        <RegisterVisual
          storeName={t('visuals.register.storeName')}
          storeNameValue={t('visuals.register.storeNameValue')}
          emailLabel={t('visuals.register.email')}
          cta={t('visuals.register.cta')}
        />
      ),
    },
    {
      key: 'products',
      visual: (
        <ProductsVisual
          products={[
            {
              name: t('visuals.products.items.0.name'),
              price: t('visuals.products.items.0.price'),
            },
            {
              name: t('visuals.products.items.1.name'),
              price: t('visuals.products.items.1.price'),
            },
            {
              name: t('visuals.products.items.2.name'),
              price: t('visuals.products.items.2.price'),
            },
          ]}
        />
      ),
    },
    {
      key: 'sell',
      visual: (
        <OrderVisual
          orderLabel={t('visuals.sell.orderLabel')}
          orderNumber={t('visuals.sell.orderNumber')}
          product={t('visuals.sell.product')}
          status={t('visuals.sell.status')}
        />
      ),
    },
    {
      key: 'payment',
      visual: (
        <PaymentVisual
          paidLabel={t('visuals.payment.paidLabel')}
          amount={t('visuals.payment.amount')}
          method={t('visuals.payment.method')}
        />
      ),
    },
  ] as const;

  const content = (
    <>
      <motion.div
        className="mb-8 max-w-2xl text-start sm:mb-10"
        initial={reduceMotion ? false : { opacity: 0, y: 20 }}
        whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 0.65, ease: EASE }}
      >
        <p className={agLayout.eyebrow}>{t('eyebrow')}</p>
        <h2 id="store-journey-heading" className={`${agLayout.sectionTitle} mt-4`}>
          {t('title')}
          <span className="text-[#9CA3AF]">{t('titleMuted')}</span>
        </h2>
        <p className={`${agLayout.lead} mt-4 max-w-xl text-[15px]`}>{t('lead')}</p>
      </motion.div>

      <div className="grid gap-4 lg:grid-cols-4">
        {steps.map((step, index) => {
          const Icon = STEP_ICONS[index];

          return (
            <JourneyStepCard
              key={step.key}
              index={index}
              icon={Icon}
              title={t(`steps.${step.key}.title`)}
              description={t(`steps.${step.key}.description`)}
              visual={step.visual}
              reduceMotion={reduceMotion}
            />
          );
        })}
      </div>
    </>
  );

  if (variant === 'page') {
    return (
      <section
        id="store-journey"
        className={`${agLayout.sectionMuted} py-16 sm:py-20 md:py-24`}
        aria-labelledby="store-journey-heading"
      >
        <div className={agLayout.container}>{content}</div>
      </section>
    );
  }

  return (
    <section
      className="mt-12 sm:mt-16"
      aria-labelledby="store-journey-heading"
    >
      {content}
    </section>
  );
}
