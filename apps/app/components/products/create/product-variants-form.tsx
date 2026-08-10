'use client';

import { useEffect, useMemo, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import {
  Button,
  Card,
  Disclosure,
  DisclosureGroup,
  Input,
  Label,
  TextField,
} from '@heroui/react';
import type {
  ProductVariantDraft,
  VariantAttribute,
} from '@/lib/products/template-types';
import { ProductFormSection } from '@/components/products/create/product-form-section';
import { VariantAttributeField } from '@/components/products/create/variant-attribute-field';

interface ProductVariantsFormProps {
  variantAttributes: VariantAttribute[];
  variants: ProductVariantDraft[];
  onChange: (variants: ProductVariantDraft[]) => void;
}

function makeVariantId() {
  return `var_${Math.random().toString(36).slice(2, 10)}`;
}

function formatVariantSummary(
  variant: ProductVariantDraft,
  variantAttributes: VariantAttribute[],
): string {
  const parts = variantAttributes
    .map((attr) => variant.attributes[attr.key]?.trim())
    .filter(Boolean);

  if (variant.stock > 0) {
    parts.push(`كمية ${variant.stock}`);
  }

  return parts.length ? parts.join(' · ') : 'لم يُملأ بعد';
}

export function ProductVariantsForm({
  variantAttributes,
  variants,
  onChange,
}: ProductVariantsFormProps) {
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(() => new Set());

  const variantIds = useMemo(
    () => variants.map((variant) => variant.id),
    [variants],
  );

  useEffect(() => {
    setExpandedKeys((current) => {
      const next = new Set([...current].filter((id) => variantIds.includes(id)));
      if (variantIds.length > 0 && next.size === 0) {
        next.add(variantIds[variantIds.length - 1]);
      }
      return next;
    });
  }, [variantIds]);

  if (!variantAttributes.length) return null;

  function addVariant() {
    const attributes: Record<string, string> = {};
    for (const attr of variantAttributes) {
      attributes[attr.key] = '';
    }

    const id = makeVariantId();
    onChange([
      ...variants,
      {
        id,
        attributes,
        stock: 0,
      },
    ]);
    setExpandedKeys((current) => new Set([...current, id]));
  }

  function updateVariant(id: string, patch: Partial<ProductVariantDraft>) {
    onChange(
      variants.map((variant) =>
        variant.id === id ? { ...variant, ...patch } : variant,
      ),
    );
  }

  function removeVariant(id: string) {
    onChange(variants.filter((variant) => variant.id !== id));
    setExpandedKeys((current) => {
      const next = new Set(current);
      next.delete(id);
      return next;
    });
  }

  return (
    <ProductFormSection
      title="المتغيرات"
      description="اختر من القائمة أو أدخل قياساً مخصصاً — كل متغير له مخزون مستقل"
      contentClassName="gap-3"
    >
      <div className="flex justify-end">
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onPress={addVariant}
          className="rounded-full"
        >
          <Plus className="size-3.5" />
          إضافة
        </Button>
      </div>

      {variants.length === 0 ? (
        <Card variant="transparent" className="border border-dashed border-border p-4 text-center shadow-none">
          <Card.Description className="text-xs">
            أضف متغيرات مثل المقاس واللون أو السعة التخزينية
          </Card.Description>
        </Card>
      ) : (
        <DisclosureGroup
          allowsMultipleExpanded
          expandedKeys={expandedKeys}
          onExpandedChange={setExpandedKeys}
          className="flex flex-col gap-3"
        >
          {variants.map((variant, index) => {
            const summary = formatVariantSummary(variant, variantAttributes);
            const isExpanded = expandedKeys.has(variant.id);

            return (
              <Card
                key={variant.id}
                variant="default"
                className="gap-0 overflow-hidden p-0"
              >
                <Disclosure id={variant.id}>
                  <div className="flex items-start gap-1 p-3 sm:p-4">
                    <Disclosure.Trigger className="flex min-w-0 flex-1 items-start gap-2 rounded-xl px-1 py-0.5 text-start">
                      <Disclosure.Indicator className="mt-0.5 size-4 shrink-0 text-muted" />
                      <div className="min-w-0 flex-1">
                        <Card.Title className="text-xs font-semibold">
                          متغير {index + 1}
                        </Card.Title>
                        {!isExpanded ? (
                          <Card.Description className="mt-0.5 truncate text-[11px] leading-snug">
                            {summary}
                          </Card.Description>
                        ) : null}
                      </div>
                    </Disclosure.Trigger>

                    <Button
                      type="button"
                      isIconOnly
                      size="sm"
                      variant="ghost"
                      onPress={() => removeVariant(variant.id)}
                      aria-label="حذف المتغير"
                      className="shrink-0 text-muted hover:text-danger"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>

                  <Disclosure.Content>
                    <Disclosure.Body className="border-t border-border px-3 pb-3 pt-3 sm:px-4 sm:pb-4">
                      <div className="grid grid-cols-2 gap-3">
                        {variantAttributes.map((attr) => (
                          <VariantAttributeField
                            key={attr.key}
                            attribute={attr}
                            value={variant.attributes[attr.key] ?? ''}
                            onChange={(nextValue) =>
                              updateVariant(variant.id, {
                                attributes: {
                                  ...variant.attributes,
                                  [attr.key]: nextValue,
                                },
                              })
                            }
                          />
                        ))}

                        <TextField
                          value={String(variant.stock)}
                          onChange={(nextValue) =>
                            updateVariant(variant.id, {
                              stock: Number(nextValue) || 0,
                            })
                          }
                          className="col-span-2 flex flex-col gap-2 sm:col-span-1"
                        >
                          <Label className="text-xs font-medium text-muted">
                            الكمية
                          </Label>
                          <Input type="number" min={0} />
                        </TextField>
                      </div>
                    </Disclosure.Body>
                  </Disclosure.Content>
                </Disclosure>
              </Card>
            );
          })}
        </DisclosureGroup>
      )}
    </ProductFormSection>
  );
}
