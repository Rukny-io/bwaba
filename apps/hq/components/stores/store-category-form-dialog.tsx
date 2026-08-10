'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button, Checkbox, Label, Modal } from '@heroui/react';
import type { AdminStoreCategory, StoreCategoryPayload } from '@/lib/types/stores';
import { hqApi } from '@/lib/hq-api';
import { appToast } from '@/lib/app-toast';
import { ApiException } from '@/lib/api-client';
import { cn } from '@/lib/utils';

const EMPTY_FORM: StoreCategoryPayload = {
  name: '',
  nameAr: '',
  slug: '',
  description: '',
  descriptionAr: '',
  icon: '',
  color: '#6366f1',
  order: 0,
  isActive: true,
  templateFields: {
    hasVariants: false,
    productAttributes: [],
    variantAttributes: [],
  },
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const fieldClassName =
  'h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--field-background)] px-3 text-sm text-[var(--foreground)] outline-none focus:border-[var(--primary)]';

const textAreaClassName =
  'w-full resize-y rounded-xl border border-[var(--border)] bg-[var(--field-background)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--primary)]';

interface StoreCategoryFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  category: AdminStoreCategory | null;
  onSaved: () => void;
}

export function StoreCategoryFormDialog({
  isOpen,
  onOpenChange,
  category,
  onSaved,
}: StoreCategoryFormDialogProps) {
  const [form, setForm] = useState<StoreCategoryPayload>(EMPTY_FORM);
  const [templateJson, setTemplateJson] = useState('');
  const [saving, setSaving] = useState(false);
  const [slugTouched, setSlugTouched] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (category) {
      setForm({
        name: category.name,
        nameAr: category.nameAr,
        slug: category.slug,
        description: category.description ?? '',
        descriptionAr: category.descriptionAr ?? '',
        icon: category.icon ?? '',
        color: category.color,
        order: category.order,
        isActive: category.isActive,
        templateFields: category.templateFields,
      });
      setTemplateJson(JSON.stringify(category.templateFields ?? {}, null, 2));
      setSlugTouched(true);
    } else {
      setForm(EMPTY_FORM);
      setTemplateJson(JSON.stringify(EMPTY_FORM.templateFields, null, 2));
      setSlugTouched(false);
    }
  }, [isOpen, category]);

  function updateField<K extends keyof StoreCategoryPayload>(
    key: K,
    value: StoreCategoryPayload[K],
  ) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === 'name' && !slugTouched) {
        next.slug = slugify(String(value));
      }
      return next;
    });
  }

  async function handleSave() {
    if (!form.name.trim() || !form.nameAr.trim() || !form.slug.trim()) {
      appToast.error('Name, Arabic name, and slug are required');
      return;
    }

    let templateFields: unknown;
    try {
      templateFields = templateJson.trim() ? JSON.parse(templateJson) : null;
    } catch {
      appToast.error('Template fields must be valid JSON');
      return;
    }

    const payload: StoreCategoryPayload = {
      ...form,
      name: form.name.trim(),
      nameAr: form.nameAr.trim(),
      slug: form.slug.trim(),
      description: form.description?.trim() || null,
      descriptionAr: form.descriptionAr?.trim() || null,
      icon: form.icon?.trim() || null,
      templateFields,
    };

    setSaving(true);
    try {
      if (category) {
        await hqApi.updateStoreCategory(category.id, payload);
        appToast.success('Category updated');
      } else {
        await hqApi.createStoreCategory(payload);
        appToast.success('Category created');
      }
      onOpenChange(false);
      onSaved();
    } catch (error) {
      appToast.error(
        error instanceof ApiException ? error.message : 'Could not save category',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal>
      <Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
        <Modal.Container size="lg" placement="center">
          <Modal.Dialog className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>
                {category ? 'Edit category' : 'Add category'}
              </Modal.Heading>
            </Modal.Header>
            <Modal.Body className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="cat-name">Name (EN)</Label>
                  <input
                    id="cat-name"
                    className={fieldClassName}
                    value={form.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    placeholder="Electronics"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="cat-name-ar">Name (AR)</Label>
                  <input
                    id="cat-name-ar"
                    className={fieldClassName}
                    value={form.nameAr}
                    onChange={(e) => updateField('nameAr', e.target.value)}
                    placeholder="الإلكترونيات"
                    dir="rtl"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="cat-slug">Slug</Label>
                  <input
                    id="cat-slug"
                    className={cn(fieldClassName, 'font-mono')}
                    value={form.slug}
                    onChange={(e) => {
                      setSlugTouched(true);
                      updateField('slug', e.target.value);
                    }}
                    placeholder="electronics"
                    dir="ltr"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="cat-icon">Icon (Lucide name)</Label>
                  <input
                    id="cat-icon"
                    className={fieldClassName}
                    value={form.icon ?? ''}
                    onChange={(e) => updateField('icon', e.target.value)}
                    placeholder="Smartphone"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label htmlFor="cat-color">Color</Label>
                  <input
                    id="cat-color"
                    type="color"
                    className={cn(fieldClassName, 'px-1')}
                    value={form.color ?? '#6366f1'}
                    onChange={(e) => updateField('color', e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="cat-order">Order</Label>
                  <input
                    id="cat-order"
                    type="number"
                    className={fieldClassName}
                    value={String(form.order ?? 0)}
                    onChange={(e) =>
                      updateField('order', Number(e.target.value) || 0)
                    }
                  />
                </div>
                <div className="flex items-end pb-1">
                  <Checkbox
                    isSelected={form.isActive ?? true}
                    onChange={(checked) => updateField('isActive', checked)}
                  >
                    Active
                  </Checkbox>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cat-desc">Description (EN)</Label>
                <textarea
                  id="cat-desc"
                  className={textAreaClassName}
                  value={form.description ?? ''}
                  onChange={(e) => updateField('description', e.target.value)}
                  rows={2}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cat-desc-ar">Description (AR)</Label>
                <textarea
                  id="cat-desc-ar"
                  className={textAreaClassName}
                  value={form.descriptionAr ?? ''}
                  onChange={(e) => updateField('descriptionAr', e.target.value)}
                  rows={2}
                  dir="rtl"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cat-template">Template fields (JSON)</Label>
                <textarea
                  id="cat-template"
                  className={cn(textAreaClassName, 'font-mono text-xs')}
                  value={templateJson}
                  onChange={(e) => setTemplateJson(e.target.value)}
                  rows={12}
                  dir="ltr"
                />
                <p className="text-[11px] text-[var(--muted-foreground)]">
                  Defines product attributes and variants shown when merchants create products.
                </p>
              </div>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="tertiary" slot="close" isDisabled={saving}>
                Cancel
              </Button>
              <Button variant="primary" isDisabled={saving} onPress={() => void handleSave()}>
                {saving ? <Loader2 className="size-4 animate-spin" /> : null}
                {category ? 'Save changes' : 'Create category'}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
