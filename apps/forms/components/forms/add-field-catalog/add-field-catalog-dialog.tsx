'use client';



import { useEffect, useMemo, useState } from 'react';

import { AnimatePresence, motion } from 'framer-motion';

import { X } from 'lucide-react';

import { FieldCategoryTabs } from '@/components/forms/add-field-catalog/field-category-tabs';

import { FieldSearch } from '@/components/forms/add-field-catalog/field-search';

import { FieldTypeList } from '@/components/forms/add-field-catalog/field-type-list';

import {

  FIELD_CATALOG_CATEGORIES,

  FIELD_CATALOG_ITEMS,

  filterCatalogItems,

  type FieldCatalogCategoryId,

  type FieldCatalogItem,

} from '@/lib/form-field-catalog';

import type { FormType } from '@/lib/forms-api';

import type { WizardFieldType } from '@/lib/form-field-types';

import { cn } from '@/lib/utils';



interface AddFieldCatalogDialogProps {

  open: boolean;

  onClose: () => void;

  formType: FormType;

  onPick: (type: WizardFieldType) => void;

  title?: string;

}



/** كتالوج إضافة الحقول — نمط add-link-dialog، يُفتح من الكمبيوتر فقط (md+). */

export function AddFieldCatalogDialog({

  open,

  onClose,

  formType,

  onPick,

  title = 'إضافة حقل',

}: AddFieldCatalogDialogProps) {

  const [search, setSearch] = useState('');

  const [category, setCategory] = useState<FieldCatalogCategoryId>('suggested');



  useEffect(() => {

    if (!open) return;

    setSearch('');

    setCategory('suggested');

  }, [open]);



  useEffect(() => {

    if (!open) return;

    const prev = document.body.style.overflow;

    document.body.style.overflow = 'hidden';

    return () => {

      document.body.style.overflow = prev;

    };

  }, [open]);



  const filteredItems = useMemo(

    () =>

      filterCatalogItems(FIELD_CATALOG_ITEMS, {

        category,

        search,

        formType,

      }),

    [category, search, formType],

  );



  function handlePick(item: FieldCatalogItem) {

    onPick(item.type);

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

            transition={{

              type: 'spring',

              damping: 32,

              stiffness: 360,

              mass: 0.9,

            }}

            onClick={onClose}

          >

            <div

              className={cn(

                'relative flex h-[76vh] max-h-[37rem] w-full max-w-[53.25rem] flex-col overflow-hidden',

                'rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-2 shadow-2xl',

              )}

              onClick={(e) => e.stopPropagation()}

              role="dialog"

              aria-modal="true"

              aria-labelledby="add-field-catalog-title"

              dir="rtl"

            >

              <div className="flex shrink-0 items-center justify-between gap-2 border-b border-[var(--border)]/70 px-5 py-3.5">

                <div className="min-w-0">

                  <h2

                    id="add-field-catalog-title"

                    className="text-[1.25rem] font-bold tracking-tight text-[var(--foreground)]"

                  >

                    {title}

                  </h2>

                  <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">

                    ابحث عن نوع الحقل أو اختر من التصنيفات.

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

                <FieldSearch value={search} onChange={setSearch} />

              </div>



              <div className="grid min-h-0 flex-1 grid-cols-[220px_1fr]">

                <aside className="border-e border-[var(--border)]/60 px-2.5 py-2.5">

                  <FieldCategoryTabs

                    categories={FIELD_CATALOG_CATEGORIES}

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

                        <FieldTypeList items={filteredItems} onPick={handlePick} />

                      </motion.div>

                    </AnimatePresence>

                  </div>

                </main>

              </div>

            </div>

          </motion.div>

        </div>

      ) : null}

    </AnimatePresence>

  );

}

