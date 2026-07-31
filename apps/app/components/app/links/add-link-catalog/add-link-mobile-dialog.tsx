'use client';

import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion, useDragControls, type PanInfo } from 'framer-motion';
import { X } from 'lucide-react';
import { LinkCategoryTabs } from '@/components/app/links/add-link-catalog/link-category-tabs';
import { FormCatalogTabs } from '@/components/app/links/add-link-catalog/form-catalog-panel';
import { LinkSearch } from '@/components/app/links/add-link-catalog/link-search';
import { LinkTypeForm } from '@/components/app/links/add-link-catalog/link-type-form';
import { FormLinkSetup } from '@/components/app/links/add-link-catalog/form-link-setup';
import { FormCatalogPanel } from '@/components/app/links/add-link-catalog/form-catalog-panel';
import { LinkTypeList } from '@/components/app/links/add-link-catalog/link-type-list';
import { listMyForms, type FormListItem } from '@/lib/forms/forms-api';
import type { CreateSocialLinkInput } from '@/lib/links/types';
import {
  filterLinkCatalogItems,
  LINK_CATALOG_CATEGORIES,
  LINK_CATALOG_ITEMS,
  type LinkCatalogCategoryId,
  type LinkCatalogItem,
  type LinkCatalogTypeId,
} from '@/lib/links/link-type-catalog';

/** ارتفاع ثابت للشيت — لا يتغيّر بين التصنيفات */
const SHEET_HEIGHT = 'h-[72dvh] max-h-[72dvh]';

const HIDDEN_SCROLL =
  'min-h-0 flex-1 overflow-y-auto overscroll-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [-webkit-overflow-scrolling:touch]';

const DISMISS_OFFSET = 88;
const DISMISS_VELOCITY = 420;

function shouldDismissSheet(info: PanInfo) {
  return info.offset.y > DISMISS_OFFSET || info.velocity.y > DISMISS_VELOCITY;
}

interface AddLinkMobileDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateSocialLinkInput) => Promise<void>;
  initialType?: LinkCatalogTypeId;
}

export function AddLinkMobileDialog({
  open,
  onClose,
  onSubmit,
  initialType,
}: AddLinkMobileDialogProps) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<LinkCatalogCategoryId>('suggested');
  const [formTab, setFormTab] = useState<'templates' | 'mine'>('templates');
  const [step, setStep] = useState<'catalog' | 'form' | 'forms-setup'>('catalog');
  const [selectedItem, setSelectedItem] = useState<LinkCatalogItem | null>(null);
  const [formTemplateId, setFormTemplateId] = useState<string | null>(null);
  const [formExisting, setFormExisting] = useState<FormListItem | null>(null);
  const [myForms, setMyForms] = useState<FormListItem[]>([]);
  const [loadingForms, setLoadingForms] = useState(false);
  const [formsError, setFormsError] = useState<string | null>(null);
  const [formsPrefetched, setFormsPrefetched] = useState(false);
  const dragControls = useDragControls();

  function handleSheetDragEnd(_: unknown, info: PanInfo) {
    if (shouldDismissSheet(info)) {
      onClose();
    }
  }

  function startSheetDrag(event: React.PointerEvent<HTMLElement>) {
    dragControls.start(event);
  }

  useEffect(() => {
    if (!open) return;
    setSearch('');
    setFormTab('templates');
    setFormTemplateId(null);
    setFormExisting(null);
    setFormsPrefetched(false);
    setMyForms([]);
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

  /** تحميل مسبق لنماذجي عند دخول قسم النماذج */
  useEffect(() => {
    if (!open || category !== 'forms' || formsPrefetched) return;

    let cancelled = false;
    setLoadingForms(true);
    setFormsError(null);
    listMyForms({ status: 'PUBLISHED', limit: 50 })
      .then((res) => {
        if (!cancelled) setMyForms(res.forms);
      })
      .catch(() => {
        if (!cancelled) setFormsError('تعذر تحميل نماذجك');
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingForms(false);
          setFormsPrefetched(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [open, category, formsPrefetched]);

  const filteredItems = useMemo(
    () => filterLinkCatalogItems({ category, search }),
    [category, search],
  );

  function handlePickItem(item: LinkCatalogItem) {
    if (item.comingSoon) return;
    setSelectedItem(item);
    setStep('form');
  }

  function handleBackFromForm() {
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
        <div className="fixed inset-0 z-[120] md:hidden">
          <motion.div
            className="fixed inset-0 bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            aria-hidden
          />
          <motion.div
            className={`fixed inset-x-0 bottom-0 flex ${SHEET_HEIGHT} w-full flex-col overflow-hidden rounded-t-[1.25rem] border border-[var(--border)] bg-[var(--surface)] shadow-2xl`}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'tween', duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
            drag="y"
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={handleSheetDragEnd}
            dir="rtl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-link-mobile-title"
          >
            {step === 'catalog' ? (
              <>
                <div
                  className="shrink-0 touch-none select-none"
                  onPointerDown={startSheetDrag}
                >
                  <div className="flex justify-center pt-2.5 pb-1" aria-hidden>
                    <div className="h-1 w-10 rounded-full bg-[var(--border)]" />
                  </div>

                  <div className="flex items-center justify-between gap-2 px-4 pb-2">
                    <h2
                      id="add-link-mobile-title"
                      className="text-[17px] font-bold tracking-tight text-[var(--foreground)]"
                    >
                      إضافة رابط
                    </h2>
                    <button
                      type="button"
                      onClick={onClose}
                      onPointerDown={(e) => e.stopPropagation()}
                      className="flex size-9 items-center justify-center rounded-full bg-[var(--surface-secondary)]/80 text-[var(--muted-foreground)] active:scale-95"
                      aria-label="إغلاق"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                </div>

                <div className="shrink-0 space-y-2.5 px-4 pb-2">
                  <LinkSearch value={search} onChange={setSearch} />
                  <LinkCategoryTabs
                    categories={LINK_CATALOG_CATEGORIES}
                    active={category}
                    onSelect={setCategory}
                    orientation="row"
                    compact
                  />
                </div>

                {category === 'forms' ? (
                  <div className="shrink-0 px-4 pb-2">
                    <FormCatalogTabs tab={formTab} onTabChange={setFormTab} compact />
                  </div>
                ) : null}

                <div
                  className={`${HIDDEN_SCROLL} px-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]`}
                  key={`${category}-${category === 'forms' ? formTab : 'links'}`}
                >
                  {category === 'forms' ? (
                    <FormCatalogPanel
                      search={search}
                      variant="compact"
                      tab={formTab}
                      hideTabs
                      myForms={myForms}
                      loadingForms={loadingForms}
                      formsError={formsError}
                      onPickTemplate={handlePickFormTemplate}
                      onPickForm={handlePickExistingForm}
                    />
                  ) : (
                    <LinkTypeList items={filteredItems} onPick={handlePickItem} compact />
                  )}
                </div>
              </>
            ) : step === 'forms-setup' ? (
              <div className="flex min-h-0 flex-1 flex-col">
                <div
                  className="flex shrink-0 touch-none select-none justify-center pt-2.5 pb-1"
                  onPointerDown={startSheetDrag}
                  aria-hidden
                >
                  <div className="h-1 w-10 rounded-full bg-[var(--border)]" />
                </div>
                <FormLinkSetup
                  onBack={handleBackFromForm}
                  onSubmit={handleFormSubmit}
                  templateId={formTemplateId}
                  existingForm={formExisting}
                />
              </div>
            ) : selectedItem ? (
              <div className="flex min-h-0 flex-1 flex-col">
                <div
                  className="flex shrink-0 touch-none select-none justify-center pt-2.5 pb-1"
                  onPointerDown={startSheetDrag}
                  aria-hidden
                >
                  <div className="h-1 w-10 rounded-full bg-[var(--border)]" />
                </div>
                <LinkTypeForm
                  item={selectedItem}
                  onBack={handleBackFromForm}
                  onSubmit={handleFormSubmit}
                />
              </div>
            ) : null}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
