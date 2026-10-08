'use client';

import { useEffect, useMemo, useState } from 'react';
import { Modal } from '@heroui/react';
import { FormCatalogPanel, FormCatalogTabs } from '@/components/app/links/add-link-catalog/form-catalog-panel';
import { FormLinkSetup } from '@/components/app/links/add-link-catalog/form-link-setup';
import { LinkCategoryTabs } from '@/components/app/links/add-link-catalog/link-category-tabs';
import {
  LinkCatalogSearch,
  useLinkCatalogUrlMode,
} from '@/components/app/links/add-link-catalog/link-catalog-search';
import { InstagramLinkSetup } from '@/components/app/links/add-link-catalog/instagram-link-setup';
import { LinkTypeForm } from '@/components/app/links/add-link-catalog/link-type-form';
import { LinkTypeList } from '@/components/app/links/add-link-catalog/link-type-list';
import type { FormListItem } from '@/lib/forms/forms-api';
import type { CreateSocialLinkInput } from '@/lib/links/types';
import { useIsDesktop } from '@/lib/use-media-query';
import {
  filterLinkCatalogItems,
  LINK_CATALOG_CATEGORIES,
  LINK_CATALOG_ITEMS,
  type LinkCatalogCategoryId,
  type LinkCatalogItem,
  type LinkCatalogTypeId,
} from '@/lib/links/link-type-catalog';

interface AddLinkCatalogDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateSocialLinkInput) => Promise<void>;
  initialType?: LinkCatalogTypeId;
}

const SCROLL_PANEL =
  'min-h-0 flex-1 overflow-y-auto overscroll-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden';

const CATEGORY_HINTS: Partial<Record<LinkCatalogCategoryId, string>> = {
  suggested: 'الأنواع الأكثر استخداماً لصفحتك',
  social: 'حساباتك على منصات التواصل',
  contact: 'طرق التواصل المباشر مع زوارك',
  forms: 'نماذج جاهزة أو نماذجك المنشورة',
  media: 'فيديو ومحتوى مرئي',
  text: 'عناوين وكتل نصية',
  commerce: 'روابط المتجر والمنتجات',
  all: 'كل أنواع الروابط المتاحة',
};

export function AddLinkCatalogDialog({
  open,
  onClose,
  onSubmit,
  initialType,
}: AddLinkCatalogDialogProps) {
  const isDesktop = useIsDesktop();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<LinkCatalogCategoryId>('suggested');
  const [formTab, setFormTab] = useState<'templates' | 'mine'>('templates');
  const [step, setStep] = useState<'catalog' | 'form' | 'forms-setup'>('catalog');
  const [selectedItem, setSelectedItem] = useState<LinkCatalogItem | null>(null);
  const [formTemplateId, setFormTemplateId] = useState<string | null>(null);
  const [formExisting, setFormExisting] = useState<FormListItem | null>(null);

  useEffect(() => {
    if (!open) return;
    setSearch('');
    setFormTab('templates');
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

  const isUrlMode = useLinkCatalogUrlMode(search);

  const filteredItems = useMemo(
    () => filterLinkCatalogItems({ category, search: isUrlMode ? '' : search }),
    [category, search, isUrlMode],
  );

  const categoryHint = CATEGORY_HINTS[category];

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

  async function handleUrlSubmit(payload: CreateSocialLinkInput) {
    await onSubmit(payload);
    onClose();
  }

  function handleOpenChange(isOpen: boolean) {
    if (!isOpen) onClose();
  }

  if (!isDesktop) return null;

  return (
    <Modal.Backdrop
      isOpen={open}
      onOpenChange={handleOpenChange}
      isDismissable
      variant="blur"
    >
      <Modal.Container placement="center" className="px-2 sm:px-3">
        <Modal.Dialog
          dir="rtl"
          lang="ar"
          aria-labelledby="add-link-catalog-title"
          className="flex h-[min(28rem,85vh)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-[var(--surface)] p-0 !shadow-none ring-0 outline-none"
        >
          {step === 'catalog' ? (
            <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
              <div className="grid h-full min-h-0 flex-1 gap-4 overflow-hidden p-4 sm:grid-cols-[12rem_minmax(0,1fr)] sm:gap-5 sm:p-5">
                <aside className="flex h-full min-h-0 flex-col gap-3">
                  <div className="flex flex-col gap-1">
                    <p className="text-[11px] font-medium text-[var(--muted-foreground)]">
                      إضافة رابط
                    </p>
                    <h2
                      id="add-link-catalog-title"
                      className="text-[18px] font-semibold leading-snug tracking-tight text-[var(--foreground)]"
                    >
                      اختر النوع
                    </h2>
                    <p className="min-h-[2rem] text-[12px] leading-relaxed text-[var(--muted-foreground)] line-clamp-2">
                      {categoryHint}
                    </p>
                  </div>

                  <div className={SCROLL_PANEL}>
                    <LinkCategoryTabs
                      categories={LINK_CATALOG_CATEGORIES}
                      active={category}
                      onSelect={setCategory}
                      orientation="column"
                      variant="panel"
                    />
                  </div>
                </aside>

                <div className="flex h-full min-h-0 flex-col gap-3">
                  <LinkCatalogSearch
                    value={search}
                    onChange={setSearch}
                    onSubmitUrl={handleUrlSubmit}
                    variant="panel"
                  />

                  {!isUrlMode && category === 'forms' ? (
                    <FormCatalogTabs tab={formTab} onTabChange={setFormTab} compact />
                  ) : null}

                  {!isUrlMode ? (
                    <div className={SCROLL_PANEL}>
                      {category === 'forms' ? (
                        <FormCatalogPanel
                          search={search}
                          variant="compact"
                          tab={formTab}
                          hideTabs
                          onPickTemplate={handlePickFormTemplate}
                          onPickForm={handlePickExistingForm}
                        />
                      ) : (
                        <LinkTypeList
                          items={filteredItems}
                          onPick={handlePickItem}
                          compact
                        />
                      )}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          ) : step === 'forms-setup' ? (
            <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
              <FormLinkSetup
                onBack={handleBack}
                onSubmit={handleFormSubmit}
                templateId={formTemplateId}
                existingForm={formExisting}
              />
            </div>
          ) : selectedItem?.id === 'instagram' ? (
            <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
              <InstagramLinkSetup onBack={handleBack} onSubmit={handleFormSubmit} />
            </div>
          ) : selectedItem ? (
            <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
              <LinkTypeForm
                item={selectedItem}
                onBack={handleBack}
                onSubmit={handleFormSubmit}
              />
            </div>
          ) : null}
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
