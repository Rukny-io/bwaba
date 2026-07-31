'use client';



import { useEffect, useMemo, useState } from 'react';

import { AlertDialog } from '@heroui/react';

import { FieldSearch } from '@/components/forms/add-field-catalog/field-search';

import { FieldTypeList } from '@/components/forms/add-field-catalog/field-type-list';

import {

  FIELD_CATALOG_ITEMS,

  filterCatalogItems,

  type FieldCatalogItem,

} from '@/lib/form-field-catalog';

import type { FormType } from '@/lib/forms-api';

import type { WizardFieldType } from '@/lib/form-field-types';



interface AddFieldMobileDialogProps {

  open: boolean;

  onOpenChange: (open: boolean) => void;

  formType: FormType;

  onPick: (type: WizardFieldType) => void;

  title?: string;

}



/** قائمة مضغوطة لإضافة الحقول على الجوال (بدون شريط التصنيفات). */

export function AddFieldMobileDialog({

  open,

  onOpenChange,

  formType,

  onPick,

  title = 'إضافة حقل',

}: AddFieldMobileDialogProps) {

  const [search, setSearch] = useState('');



  useEffect(() => {

    if (!open) setSearch('');

  }, [open]);



  const items = useMemo(

    () =>

      filterCatalogItems(FIELD_CATALOG_ITEMS, {

        category: 'all',

        search,

        formType,

      }),

    [search, formType],

  );



  function handlePick(item: FieldCatalogItem) {

    onPick(item.type);

    onOpenChange(false);

  }



  return (

    <AlertDialog.Backdrop

      isDismissable

      isOpen={open}

      onOpenChange={onOpenChange}

      variant="blur"

      className="md:hidden"

    >

      <AlertDialog.Container placement="bottom" size="lg">

        <AlertDialog.Dialog className="flex max-h-[min(85dvh,560px)] flex-col rounded-t-2xl p-0">

          <AlertDialog.CloseTrigger />

          <AlertDialog.Header className="border-b border-[var(--border)]/60 px-4 pb-4 pt-4">

            <AlertDialog.Heading className="text-base">

              {title}

            </AlertDialog.Heading>

          </AlertDialog.Header>

          <AlertDialog.Body className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden px-4 py-1">

            <FieldSearch value={search} onChange={setSearch} />

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">

              <FieldTypeList items={items} onPick={handlePick} />

            </div>

          </AlertDialog.Body>

        </AlertDialog.Dialog>

      </AlertDialog.Container>

    </AlertDialog.Backdrop>

  );

}

