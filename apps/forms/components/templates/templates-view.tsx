'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  FolderKanban,
  LayoutTemplate,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { TemplateCard } from '@/components/templates/template-card';
import { TemplatesGridSkeleton } from '@/components/templates/templates-grid-skeleton';
import { TemplatesToolbar } from '@/components/templates/templates-toolbar';
import { DashboardEmptyState } from '@/components/app/dashboard-empty-state';
import { DashboardErrorState } from '@/components/app/dashboard-error-state';
import { DashboardPageHeader } from '@/components/app/dashboard-page-header';
import { DashboardSurface } from '@/components/app/dashboard-surface';
import { ApiException } from '@/lib/api-client';
import {
  createFormFromTemplate,
  getCreatingPathAfterTemplate,
  getPreviewPathAfterTemplate,
} from '@/lib/form-template-create';
import {
  filterTemplates,
  getAllTemplates,
  getFeaturedTemplates,
  getTemplateById,
  TEMPLATE_CATEGORY_LABELS,
  type FormTemplateDefinition,
  type TemplateCategory,
  type TemplateTypeFilter,
} from '@/lib/form-templates';

function TemplatesSummary() {
  const catalog = useMemo(() => getAllTemplates(), []);
  const featuredCount = catalog.filter((t) => t.featured).length;
  const popularCount = catalog.filter((t) => t.popular).length;
  const categoryCount = useMemo(
    () => new Set(catalog.map((t) => t.category)).size,
    [catalog],
  );

  const items = [
    {
      icon: LayoutTemplate,
      label: 'إجمالي القوالب',
      value: String(catalog.length),
      hint: 'جاهزة للاستخدام',
    },
    {
      icon: Sparkles,
      label: 'مميزة',
      value: String(featuredCount),
      hint: 'موصى بها للبدء',
    },
    {
      icon: TrendingUp,
      label: 'شائعة',
      value: String(popularCount),
      hint: 'الأكثر اختياراً',
    },
    {
      icon: FolderKanban,
      label: 'الفئات',
      value: String(categoryCount),
      hint: Object.values(TEMPLATE_CATEGORY_LABELS).slice(0, 2).join(' · '),
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <DashboardSurface
            key={item.label}
            padding="sm"
            className="flex items-center gap-3"
          >
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[var(--surface-secondary)] text-[var(--primary)]">
              <Icon size={16} strokeWidth={1.7} />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-[var(--muted-foreground)]">
                {item.label}
              </p>
              <p
                className="text-base font-bold tabular-nums text-[var(--foreground)] sm:text-lg"
                dir="ltr"
                lang="en"
              >
                {item.value}
              </p>
              <p className="truncate text-[10px] text-[var(--muted-foreground)]/80">
                {item.hint}
              </p>
            </div>
          </DashboardSurface>
        );
      })}
    </div>
  );
}

export function TemplatesView() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState('');
  const [formType, setFormType] = useState<TemplateTypeFilter>('');
  const [category, setCategory] = useState<TemplateCategory | ''>('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [deepLinkHandled, setDeepLinkHandled] = useState(false);

  const featured = useMemo(() => getFeaturedTemplates(), []);

  const filtered = useMemo(
    () =>
      filterTemplates({
        query,
        formType,
        category,
      }),
    [query, formType, category],
  );

  const deepLinkTemplateId = searchParams.get('template');

  useEffect(() => {
    setReady(true);
  }, []);

  const runTemplateAction = useCallback(
    async (template: FormTemplateDefinition, mode: 'preview' | 'use') => {
      setBusyId(template.id);
      setError(null);
      try {
        const form = await createFormFromTemplate(template.id);
        router.push(
          mode === 'preview'
            ? getPreviewPathAfterTemplate(form.slug)
            : getCreatingPathAfterTemplate(form.slug),
        );
      } catch (e) {
        setError(
          e instanceof ApiException
            ? e.message
            : e instanceof Error
              ? e.message
              : 'تعذّر إنشاء النموذج من القالب',
        );
        setBusyId(null);
      }
    },
    [router],
  );

  useEffect(() => {
    if (!ready || !deepLinkTemplateId || deepLinkHandled) return;
    const template = getTemplateById(deepLinkTemplateId);
    if (!template) return;

    setDeepLinkHandled(true);
    void runTemplateAction(template, 'preview');
  }, [ready, deepLinkTemplateId, deepLinkHandled, runTemplateAction]);

  const handlePreview = useCallback(
    (template: FormTemplateDefinition) => {
      void runTemplateAction(template, 'preview');
    },
    [runTemplateAction],
  );

  const handleUse = useCallback(
    (template: FormTemplateDefinition) => {
      void runTemplateAction(template, 'use');
    },
    [runTemplateAction],
  );

  const showFeatured =
    !query && !formType && !category && featured.length > 0;

  const featuredIds = useMemo(
    () => new Set(featured.map((t) => t.id)),
    [featured],
  );

  const catalogTemplates = useMemo(() => {
    if (!showFeatured) return filtered;
    return filtered.filter((t) => !featuredIds.has(t.id));
  }, [filtered, featuredIds, showFeatured]);

  const isDeepLinkBusy = Boolean(deepLinkTemplateId && !deepLinkHandled);

  return (
    <>
      <DashboardPageHeader
        title="القوالب"
        description="ابدأ من قالب جاهز — عدّل الحقول ثم انشر نموذجك."
        className="mb-0"
      />

      <TemplatesSummary />

      {error ? (
        <DashboardErrorState variant="inline" message={error} />
      ) : null}

      <TemplatesToolbar
        query={query}
        formType={formType}
        category={category}
        onQueryChange={setQuery}
        onFormTypeChange={setFormType}
        onCategoryChange={setCategory}
      />

      {!ready || isDeepLinkBusy ? (
        <TemplatesGridSkeleton />
      ) : (
        <>
          {showFeatured ? (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles
                  className="size-4 text-[var(--primary)]"
                  strokeWidth={1.8}
                />
                <h2 className="text-sm font-semibold text-[var(--foreground)]">
                  قوالب مميزة
                </h2>
              </div>
              <div className="grid grid-cols-2 items-stretch gap-3 sm:gap-4 xl:grid-cols-4">
                {featured.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    busy={busyId === template.id}
                    onPreview={handlePreview}
                    onUse={handleUse}
                  />
                ))}
              </div>
            </section>
          ) : null}

          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-[var(--foreground)]">
              {showFeatured ? 'كل القوالب' : 'النتائج'}
              <span
                className="ms-2 text-[var(--muted-foreground)]"
                dir="ltr"
                lang="en"
              >
                ({catalogTemplates.length})
              </span>
            </h2>

            {catalogTemplates.length === 0 ? (
              <DashboardEmptyState
                compact
                title="لا توجد قوالب مطابقة"
                description={
                  showFeatured
                    ? 'جميع القوالب المميزة معروضة أعلاه.'
                    : 'جرّب تغيير البحث أو إزالة الفلاتر.'
                }
              />
            ) : (
              <div className="grid grid-cols-2 items-stretch gap-3 sm:gap-4 xl:grid-cols-4">
                {catalogTemplates.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    busy={busyId === template.id}
                    onPreview={handlePreview}
                    onUse={handleUse}
                  />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </>
  );
}
