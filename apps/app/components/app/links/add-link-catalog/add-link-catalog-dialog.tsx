'use client';

import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { LinkCategoryTabs } from '@/components/app/links/add-link-catalog/link-category-tabs';
import { LinkSearch } from '@/components/app/links/add-link-catalog/link-search';
import { LinkTypeForm } from '@/components/app/links/add-link-catalog/link-type-form';
import { FormLinkSetup } from '@/components/app/links/add-link-catalog/form-link-setup';
import { FormCatalogPanel } from '@/components/app/links/add-link-catalog/form-catalog-panel';
import { LinkTypeList } from '@/components/app/links/add-link-catalog/link-type-list';
import type { FormListItem } from '@/lib/forms/forms-api';
import type { CreateSocialLinkInput } from '@/lib/links/types';
import {
  filterLinkCatalogItems,
  LINK_CATALOG_CATEGORIES,
  LINK_CATALOG_ITEMS,
  type LinkCatalogCategoryId,
  type LinkCatalogItem,
  type LinkCatalogTypeId,
} from '@/lib/links/link-type-catalog';
import { cn } from '@/lib/utils';

interface AddLinkCatalogDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateSocialLinkInput) => Promise<void>;
  initialType?: LinkCatalogTypeId;
}

export function AddLinkCatalogDialog({
  open,
  onClose,
  onSubmit,
  initialType,
}: AddLinkCatalogDialogProps) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<LinkCatalogCategoryId>('suggested');
  const [step, setStep] = useState<'catalog' | 'form' | 'forms-setup'>('catalog');
  const [selectedItem, setSelectedItem] = useState<LinkCatalogItem | null>(null);
  const [formTemplateId, setFormTemplateId] = useState<string | null>(null);
  const [formExisting, setFormExisting] = useState<FormListItem | null>(null);

  useEffect(() => {
    if (!open) return;
    setSearch('');
    setFormTemplateId(null);
    setFormExisting(null);
    if (initialType === 'form') {
      setCategory('forms');
      setSelectedItem(null);
      setStep('catalog');
    } else if (initialType) {
      const item = LINK_CATALOG_ITEMS.find((i) => i.id === initialType);
      if (item) {
        setSelectedItem(item);
        setStep('form');
      } else {
        setSelectedItem(null);
        setStep('catalog');
      }
      setCategory('suggested');
    } else {
      setCategory('suggested');
      setSelectedItem(null);
      setStep('catalog');
    }
  }, [open, initialType]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const filteredItems = useMemo(
    () => filterLinkCatalogItems({ category, search }),
    [category, search],
  );

  function handlePickItem(item: LinkCatalogItem) {
    if (item.comingSoon) return;
    setSelectedItem(item);
    setStep('form');
  }

  function handleBack() {
    if (step === 'forms-setup') {
      setStep('catalog');
      setFormTemplateId(null);
      setFormExisting(null);
      return;
    }
    setStep('catalog');
    setSelectedItem(null);
  }

  function handlePickFormTemplate(templateId: string) {
    setFormTemplateId(templateId);
    setFormExisting(null);
    setStep('forms-setup');
  }

  function handlePickExistingForm(form: FormListItem) {
    setFormExisting(form);
    setFormTemplateId(null);
    setStep('forms-setup');
  }

  async function handleFormSubmit(payload: CreateSocialLinkInput) {
    await onSubmit(payload);
    onClose();
  }

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[120] hidden md:block">
          <motion.div
            className="fixed inset-0 bg-black/45 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
            onClick={onClose}
            aria-hidden
          />

          <motion.div
            className="fixed inset-0 flex items-center justify-center p-6"
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 8 }}
            transition={{ type: 'spring', damping: 32, stiffness: 360, mass: 0.9 }}
            onClick={onClose}
          >
            <div
              className={cn(
                'relative flex h-[76vh] max-h-[37rem] w-full max-w-[53.25rem] flex-col overflow-hidden',
                'rounded-4xl  bg-[var(--surface)] p-2 shadow-2xl',
              )}
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="add-link-catalog-title"
              dir="rtl"
            >
              {step === 'catalog' ? (
                <>
                  <div className="flex shrink-0 items-center justify-between gap-2 border-b border-[var(--border)]/70 px-5 py-3.5">
                    <div className="min-w-0">
                      <h2
                        id="add-link-catalog-title"
                        className="text-[1.25rem] font-bold tracking-tight text-[var(--foreground)]"
                      >
                        إضافة رابط
                      </h2>
                      <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                        ابحث عن نوع الرابط أو اختر من التصنيفات
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={onClose}
                      className="flex size-9 shrink-0 items-center justify-center rounded-full text-[var(--muted-foreground)] transition-all hover:bg-[var(--surface-secondary)] hover:text-[var(--foreground)] active:scale-90"
                      aria-label="إغلاق"
                    >
                      <X className="size-5" />
                    </button>
                  </div>

                  <div className="shrink-0 px-5 py-3.5">
                    <LinkSearch value={search} onChange={setSearch} />
                  </div>

                  <div className="grid min-h-0 flex-1 grid-cols-[220px_1fr]">
                    <aside className="border-e border-[var(--border)]/60 px-2.5 py-2.5">
                      <LinkCategoryTabs
                        categories={LINK_CATALOG_CATEGORIES}
                        active={category}
                        onSelect={setCategory}
                        orientation="column"
                      />
                    </aside>

                    <main className="flex min-h-0 flex-col p-3">
                      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                        <AnimatePresence mode="wait" initial={false}>
                          <motion.div
                            key={`${category}-${search}`}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
                          >
                            {category === 'forms' ? (
                              <FormCatalogPanel
                                search={search}
                                onPickTemplate={handlePickFormTemplate}
                                onPickForm={handlePickExistingForm}
                              />
                            ) : (
                              <LinkTypeList items={filteredItems} onPick={handlePickItem} />
                            )}
                          </motion.div>
                        </AnimatePresence>
                      </div>
                    </main>
                  </div>
                </>
              ) : step === 'forms-setup' ? (
                <FormLinkSetup
                  onBack={handleBack}
                  onSubmit={handleFormSubmit}
                  templateId={formTemplateId}
                  existingForm={formExisting}
                />
              ) : selectedItem ? (
                <LinkTypeForm
                  item={selectedItem}
                  onBack={handleBack}
                  onSubmit={handleFormSubmit}
                />
              ) : null}
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
