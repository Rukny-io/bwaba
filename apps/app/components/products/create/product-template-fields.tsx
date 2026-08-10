'use client';

import {
  Chip,
  Input,
  Label,
  ListBox,
  Select,
  Switch,
  TextArea,
  TextField,
  cn,
} from '@heroui/react';
import type {
  TemplateField,
  TemplateFieldValue,
} from '@/lib/products/template-types';
import { ProductFormSection } from '@/components/products/create/product-form-section';

interface ProductTemplateFieldsProps {
  fields: TemplateField[];
  values: Record<string, TemplateFieldValue>;
  onChange: (key: string, value: TemplateFieldValue) => void;
  title?: string;
  description?: string;
}

function fieldSpansFullWidth(field: TemplateField) {
  return field.type === 'textarea' || field.type === 'multiselect' || field.type === 'boolean';
}

export function ProductTemplateFields({
  fields,
  values,
  onChange,
  title = 'تفاصيل التصنيف',
  description = 'حقول مخصصة حسب نشاط متجرك',
}: ProductTemplateFieldsProps) {
  if (!fields.length) return null;

  return (
    <ProductFormSection
      title={title}
      description={description}
      contentClassName="grid grid-cols-2 gap-3 sm:gap-4"
    >
      {fields.map((field) => (
        <div
          key={field.key}
          className={cn(fieldSpansFullWidth(field) && 'col-span-2')}
        >
          <TemplateFieldControl
            field={field}
            value={values[field.key]}
            onChange={(value) => onChange(field.key, value)}
          />
        </div>
      ))}
    </ProductFormSection>
  );
}

function TemplateFieldControl({
  field,
  value,
  onChange,
}: {
  field: TemplateField;
  value: TemplateFieldValue | undefined;
  onChange: (value: TemplateFieldValue) => void;
}) {
  const labelText = (
    <>
      {field.labelAr}
      {field.required ? <span className="text-danger"> *</span> : null}
    </>
  );

  switch (field.type) {
    case 'textarea':
      return (
        <TextField
          value={typeof value === 'string' ? value : ''}
          onChange={onChange}
          className="flex flex-col gap-2"
        >
          <Label className="text-xs font-medium text-muted">{labelText}</Label>
          <TextArea
            placeholder={field.placeholder}
            rows={3}
            className="min-h-[5.5rem] resize-none"
          />
        </TextField>
      );

    case 'select':
      return (
        <Select
          selectedKey={
            typeof value === 'string' && value ? value : null
          }
          onSelectionChange={(key) => onChange(key ? String(key) : '')}
          placeholder="اختر…"
          className="flex flex-col gap-2"
        >
          <Label className="text-xs font-medium text-muted">{labelText}</Label>
          <Select.Trigger>
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              {(field.options ?? []).map((option) => (
                <ListBox.Item key={option} id={option} textValue={option}>
                  {option}
                  <ListBox.ItemIndicator />
                </ListBox.Item>
              ))}
            </ListBox>
          </Select.Popover>
        </Select>
      );

    case 'multiselect': {
      const selected = Array.isArray(value) ? value : [];
      return (
        <div className="flex flex-col gap-2">
          <Label className="text-xs font-medium text-muted">{labelText}</Label>
          <div className="flex flex-wrap gap-2">
            {(field.options ?? []).map((option) => {
              const active = selected.includes(option);
              return (
                <Chip
                  key={option}
                  size="sm"
                  variant={active ? 'solid' : 'soft'}
                  className="cursor-pointer"
                  onClick={() => {
                    if (active) {
                      onChange(selected.filter((item) => item !== option));
                    } else {
                      onChange([...selected, option]);
                    }
                  }}
                >
                  {option}
                </Chip>
              );
            })}
          </div>
        </div>
      );
    }

    case 'boolean':
      return (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-field px-4 py-3">
          <Label className="text-sm font-medium">{labelText}</Label>
          <Switch
            isSelected={value === true}
            onChange={onChange}
            aria-label={field.labelAr}
          >
            <Switch.Control>
              <Switch.Thumb />
            </Switch.Control>
          </Switch>
        </div>
      );

    case 'number':
      return (
        <TextField
          value={typeof value === 'string' ? value : ''}
          onChange={onChange}
          className="flex flex-col gap-2"
        >
          <Label className="text-xs font-medium text-muted">{labelText}</Label>
          <Input type="number" placeholder={field.placeholder} />
        </TextField>
      );

    case 'date':
      return (
        <TextField
          value={typeof value === 'string' ? value : ''}
          onChange={onChange}
          className="flex flex-col gap-2"
        >
          <Label className="text-xs font-medium text-muted">{labelText}</Label>
          <Input type="date" />
        </TextField>
      );

    default:
      return (
        <TextField
          value={typeof value === 'string' ? value : ''}
          onChange={onChange}
          className="flex flex-col gap-2"
        >
          <Label className="text-xs font-medium text-muted">{labelText}</Label>
          <Input placeholder={field.placeholder} />
        </TextField>
      );
  }
}
