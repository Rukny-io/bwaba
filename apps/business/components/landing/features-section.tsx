'use client';

import { motion } from 'framer-motion';
import { Clock3, Layers, ShieldCheck, Sparkles, Users } from 'lucide-react';

const FEATURES = [
  {
    icon: Layers,
    title: 'صندوق وارد موحّد',
    description: 'Instagram و Messenger (قريباً) في واجهة واحدة بدون التبديل بين التطبيقات.',
  },
  {
    icon: Clock3,
    title: 'رد أسرع',
    description: 'تابع المحادثات غير المقروءة، ابحث فوراً، ورد من نفس الشاشة.',
  },
  {
    icon: Users,
    title: 'حسابات متعددة',
    description: 'اربط أكثر من حساب Instagram Professional وادِرها من لوحة واحدة.',
  },
  {
    icon: ShieldCheck,
    title: 'أمان Meta',
    description: 'OAuth رسمي، tokens مشفّرة، وامتثال لسياسات Meta Business.',
  },
  {
    icon: Sparkles,
    title: 'تصميم متناسق',
    description: 'نفس تجربة ركني Forms — عربي، RTL، وبطاقات زجاجية أنيقة.',
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="scroll-mt-24 py-16 min-[720px]:py-24">
      <div className="mx-auto max-w-6xl px-5 min-[720px]:px-6">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-bold tracking-tight text-[var(--foreground)] min-[720px]:text-3xl">
            كل ما تحتاجه لإدارة المحادثات
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-[var(--muted-foreground)] min-[720px]:text-base">
            Business Hub مبني للفرق العربية التي تبيع وتدعم عبر Instagram و Messenger.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature, index) => (
            <motion.article
              key={feature.title}
              className="landing-glass rounded-[1.5rem] p-5"
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ delay: index * 0.05, duration: 0.45 }}
            >
              <feature.icon className="size-5 text-[var(--primary)]" />
              <h3 className="mt-4 text-base font-semibold text-[var(--foreground)]">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--muted-foreground)]">
                {feature.description}
              </p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
