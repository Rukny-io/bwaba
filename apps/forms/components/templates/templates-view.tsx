'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Sparkles } from 'lucide-react';
import { TemplateCard } from '@/components/templates/template-card';
import { TemplatesGridSkeleton } from '@/components/templates/templates-grid-skeleton';
import { TemplatesToolbar } from '@/components/templates/templates-toolbar';
import { DashboardEmptyState } from '@/components/app/dashboard-empty-state';
import { DashboardErrorState } from '@/components/app/dashboard-error-state';
import { DashboardPageHeader } from '@/components/app/dashboard-page-header';
import { ApiException } from '@/lib/api-client';
import {
  createFormFromTemplate,
  getCreatingPathAfterTemplate,
  getPreviewPathAfterTemplate,
} from '@/lib/form-template-create';
import {
  filterTemplates,
  getFeaturedTemplates,
  getTemplateById,
  type FormTemplateDefinition,
  type TemplateCategory,
  type TemplateTypeFilter,
} from '@/lib/form-templates';

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
    async (
      template: FormTemplateDefinition,
      mode: 'preview' | 'use',
    ) => {
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
      />

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
                <Sparkles className="size-4 text-[var(--foreground)]" />
                <h2 className="text-sm font-semibold text-[var(--foreground)]">
                  قوالب مميزة
                </h2>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
                {featured.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    busy={busyId === template.id}
                    onPreview={handlePreview}
                    onUse={handleUse}
                    compact
                  />
                ))}
              </div>
            </section>
          ) : null}

          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-[var(--foreground)]">
              {showFeatured ? 'كل القوالب' : 'النتائج'}
              <span className="ms-2 text-[var(--muted-foreground)]" dir="ltr" lang="en">
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
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
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
