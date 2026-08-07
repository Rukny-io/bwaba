'use client';

import type { Key } from 'react';
import { ChevronDown, LayoutTemplate, ListTree, Sparkles } from 'lucide-react';
import { Button, Dropdown, Header, Label } from '@heroui/react';
import {
  getFieldCatalogItem,
  getSuggestedFieldTypes,
} from '@/lib/form-field-catalog';
import type { FormType } from '@/lib/forms-api';
import { getFormTypeLabel } from '@/lib/forms-format';
import type { WizardFieldType } from '@/lib/form-field-types';
import { cn } from '@/lib/utils';

interface FormCreateTypeFieldsButtonProps {
  formType: FormType;
  onInsert: (type: WizardFieldType) => void;
  onOpenCatalog: () => void;
  onUseTemplate: () => void;
  className?: string;
}

export function FormCreateTypeFieldsButton({
  formType,
  onInsert,
  onOpenCatalog,
  onUseTemplate,
  className,
}: FormCreateTypeFieldsButtonProps) {
  const typeLabel = getFormTypeLabel(formType);
  const suggested = getSuggestedFieldTypes(formType);
  const rtlItemClassName = 'justify-start text-right [direction:rtl]';
  const rtlLabelClassName = 'min-w-0 flex-1 text-right';

  function handleAction(key: Key) {
    const id = String(key);
    if (id === 'template') {
      onUseTemplate();
      return;
    }
    if (id === 'catalog') {
      onOpenCatalog();
      return;
    }
    onInsert(id as WizardFieldType);
  }

  return (
    <Dropdown>
      <Button
        variant="outline"
        className={cn(
          'h-9 gap-2 rounded-full border-[var(--border)] bg-[var(--surface-secondary)] px-3.5 text-sm font-medium',
          'text-[var(--foreground)] hover:bg-[var(--surface-tertiary)]',
          className,
        )}
      >
        <Sparkles className="size-4 shrink-0 text-[var(--primary)]" strokeWidth={1.8} />
        <span>حقول {typeLabel}</span>
        <ChevronDown className="size-4 shrink-0 opacity-60" />
      </Button>
      <Dropdown.Popover
        placement="bottom start"
        className="min-w-[15rem] text-right [direction:rtl]"
      >
        <Dropdown.Menu
          onAction={handleAction}
          aria-label={`حقول مقترحة لنوع ${typeLabel}`}
          className="text-right [direction:rtl]"
        >
          <Dropdown.Section>
            <Header className="text-right [direction:rtl]">
              حقول مقترحة لنوع {typeLabel}
            </Header>
            {suggested.map((type) => {
              const item = getFieldCatalogItem(type);
              if (!item) return null;
              const Icon = item.icon;
              return (
                <Dropdown.Item
                  key={type}
                  id={type}
                  textValue={item.label}
                  className={rtlItemClassName}
                >
                  <Icon className="size-4 shrink-0 text-[var(--primary)]" strokeWidth={1.8} />
                  <Label className={rtlLabelClassName}>{item.label}</Label>
                </Dropdown.Item>
              );
            })}
          </Dropdown.Section>
          <Dropdown.Section>
            <Dropdown.Item
              id="template"
              textValue="استخدام القالب"
              className={rtlItemClassName}
            >
              <LayoutTemplate className="size-4 shrink-0" />
              <Label className={rtlLabelClassName}>استخدام قالب «{typeLabel}»</Label>
            </Dropdown.Item>
            <Dropdown.Item
              id="catalog"
              textValue="جميع الحقول"
              className={rtlItemClassName}
            >
              <ListTree className="size-4 shrink-0" />
              <Label className={rtlLabelClassName}>تصفح جميع الحقول…</Label>
            </Dropdown.Item>
          </Dropdown.Section>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}
