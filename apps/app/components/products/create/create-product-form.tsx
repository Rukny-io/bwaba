'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, Loader2, Upload } from 'lucide-react';
import {
  Alert,
  Button,
  Card,
  Input,
  Label,
  ListBox,
  Select,
  Skeleton,
  TextArea,
  TextField,
} from '@heroui/react';
import { ProductPriceField } from '@/components/products/create/product-price-field';
import { ProductFormSection } from '@/components/products/create/product-form-section';
import { ProductCreatePill } from '@/components/products/create/page/product-create-primitives';
import {
  ProductImagesUpload,
  type PendingProductImage,
} from '@/components/products/create/product-images-upload';
import { ProductTemplateFields } from '@/components/products/create/product-template-fields';
import { ProductVariantsForm } from '@/components/products/create/product-variants-form';
import { ApiException } from '@/lib/api-client';
import {
  createProduct,
  fetchStoreProductTemplate,
  uploadDigitalProductFile,
  uploadProductImages,
} from '@/lib/products/api';
import type { ProductKindCatalogItem } from '@/lib/products/product-kind-catalog';
import {
  getCategoryFormUi,
  getCategoryKindHint,
} from '@/lib/products/category-template-config';
import {
  createEmptyTemplateValues,
  resolveTemplateForKind,
  validateTemplateValues,
  validateVariantDrafts,
} from '@/lib/products/template-utils';
import type {
  CategoryTemplateFields,
  ProductVariantDraft,
  TemplateFieldValue,
} from '@/lib/products/template-types';
import {
  DELIVERY_METHOD_OPTIONS,
  SERVICE_TYPE_OPTIONS,
  type ProductKind,
} from '@/lib/products/types';
import { cn } from '@/lib/utils';

interface CreateProductFormProps {
  kind: ProductKind;
  catalogItem: ProductKindCatalogItem;
  onBack: () => void;
  onCreated?: () => void;
  mobile?: boolean;
  layout?: 'embedded' | 'page';
  formId?: string;
  onSubmittingChange?: (submitting: boolean) => void;
  className?: string;
}

function makeImageId() {
  return `img_${Math.random().toString(36).slice(2, 10)}`;
}

export function CreateProductForm({
  kind,
  catalogItem,
  onBack,
  onCreated,
  mobile = false,
  layout = 'embedded',
  formId,
  onSubmittingChange,
  className,
}: CreateProductFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [sku, setSku] = useState('');
  const [serviceType, setServiceType] = useState('consultation');
  const [serviceDuration, setServiceDuration] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState('online');
  const [images, setImages] = useState<PendingProductImage[]>([]);
  const [digitalFile, setDigitalFile] = useState<File | null>(null);
  const [uploadingAssets, setUploadingAssets] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [templateLoading, setTemplateLoading] = useState(true);
  const [templateLoadError, setTemplateLoadError] = useState<string | null>(null);
  const [storeCategoryName, setStoreCategoryName] = useState<string | null>(null);
  const [storeCategorySlug, setStoreCategorySlug] = useState<string | null>(null);
  const [baseTemplate, setBaseTemplate] = useState<CategoryTemplateFields | null>(null);
  const [templateValues, setTemplateValues] = useState<Record<string, TemplateFieldValue>>(
    {},
  );
  const [variants, setVariants] = useState<ProductVariantDraft[]>([]);

  const template = useMemo(
    () => resolveTemplateForKind(baseTemplate, kind, storeCategorySlug),
    [baseTemplate, kind, storeCategorySlug],
  );

  const categoryUi = useMemo(
    () => getCategoryFormUi(storeCategorySlug),
    [storeCategorySlug],
  );

  const categoryKindHint = useMemo(
    () => getCategoryKindHint(storeCategorySlug, kind),
    [storeCategorySlug, kind],
  );

  useEffect(() => {
    let cancelled = false;

    async function loadTemplate() {
      setTemplateLoading(true);
      setTemplateLoadError(null);
      try {
        const response = await fetchStoreProductTemplate();
        if (cancelled) return;

        const nextTemplate = response.template;
        setStoreCategoryName(response.categoryNameAr ?? response.categoryName);
        setStoreCategorySlug(response.categorySlug);
        setBaseTemplate(nextTemplate);
        setTemplateValues(
          createEmptyTemplateValues(
            resolveTemplateForKind(
              nextTemplate,
              kind,
              response.categorySlug,
            ),
          ),
        );
      } catch (err) {
        if (!cancelled) {
          setBaseTemplate(null);
          setStoreCategorySlug(null);
          setTemplateValues({});
          setTemplateLoadError(
            err instanceof ApiException
              ? err.message
              : 'تعذّر تحميل حقول التصنيف',
          );
        }
      } finally {
        if (!cancelled) setTemplateLoading(false);
      }
    }

    void loadTemplate();
    return () => {
      cancelled = true;
    };
  }, [kind]);

  const imagesRef = useRef(images);
  imagesRef.current = images;

  useEffect(() => {
    return () => {
      imagesRef.current.forEach((image) => {
        if (image.previewUrl.startsWith('blob:')) {
          URL.revokeObjectURL(image.previewUrl);
        }
      });
    };
  }, []);

  const useVariants = Boolean(
    kind === 'PHYSICAL' && template?.hasVariants && variants.length > 0,
  );

  const showLegacyServiceFields = kind === 'SERVICE' && !template?.productAttributes?.length;

  const isPageLayout = layout === 'page';
  const isBusy = saving || uploadingAssets;

  useEffect(() => {
    onSubmittingChange?.(isBusy);
  }, [isBusy, onSubmittingChange]);

  const templateFields = useMemo(() => template?.productAttributes ?? [], [template]);

  function handleTemplateValueChange(key: string, value: TemplateFieldValue) {
    setTemplateValues((current) => ({ ...current, [key]: value }));
  }

  function handlePickImages(files: FileList | File[]) {
    const list = Array.from(files);
    if (!list.length) return;

    setImages((current) => {
      const remaining = 5 - current.length;
      const next = list.slice(0, remaining).map((file) => ({
        id: makeImageId(),
        file,
        previewUrl: URL.createObjectURL(file),
      }));
      return [...current, ...next];
    });
  }

  function handleRemoveImage(id: string) {
    setImages((current) => {
      const target = current.find((image) => image.id === id);
      if (target?.previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return current.filter((image) => image.id !== id);
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (templateLoading) {
      return;
    }

    const trimmedName = name.trim();
    const parsedPrice = Number(price);
    const parsedQuantity = Number(quantity);

    if (trimmedName.length < 2) {
      setError('أدخل اسماً للمنتج (حرفان على الأقل)');
      return;
    }

    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      setError('أدخل سعراً صالحاً');
      return;
    }

    if (
      kind === 'PHYSICAL' &&
      !useVariants &&
      (!Number.isFinite(parsedQuantity) || parsedQuantity < 0)
    ) {
      setError('أدخل كمية مخزون صالحة');
      return;
    }

    const templateError = validateTemplateValues(template, templateValues);
    if (templateError) {
      setError(templateError);
      return;
    }

    const variantError = validateVariantDrafts(template, variants);
    if (variantError) {
      setError(variantError);
      return;
    }

    if (kind === 'DIGITAL' && !digitalFile) {
      setError('ارفع ملف المنتج الرقمي');
      return;
    }

    setSaving(true);
    try {
      const product = await createProduct(
        {
          kind,
          name: trimmedName,
          description: description.trim() || undefined,
          price: parsedPrice,
          quantity: kind === 'PHYSICAL' && !useVariants ? parsedQuantity : 0,
          sku: sku.trim() || undefined,
          serviceType: showLegacyServiceFields ? serviceType : undefined,
          serviceDuration: showLegacyServiceFields ? serviceDuration : undefined,
          deliveryMethod: showLegacyServiceFields ? deliveryMethod : undefined,
          templateValues: template ? templateValues : undefined,
          hasVariants: useVariants,
          variants: useVariants
            ? variants.map((variant) => ({
                attributes: variant.attributes,
                stock: variant.stock,
              }))
            : undefined,
        },
        template,
      );

      setUploadingAssets(true);

      if (images.length > 0) {
        await uploadProductImages(
          product.id,
          images.map((image) => image.file),
        );
      }

      if (kind === 'DIGITAL' && digitalFile) {
        await uploadDigitalProductFile(product.id, digitalFile);
      }

      onCreated?.();
    } catch (err) {
      setError(
        err instanceof ApiException
          ? err.message
          : 'تعذّر إنشاء المنتج',
      );
    } finally {
      setSaving(false);
      setUploadingAssets(false);
    }
  }

  return (
    <form
      id={formId}
      onSubmit={handleSubmit}
      className={cn('flex min-h-0 flex-1 flex-col', className)}
      dir="rtl"
    >
      {!isPageLayout ? (
        <div className="flex shrink-0 items-center gap-3 border-b border-border/70 px-5 py-3.5">
          <Button
            type="button"
            isIconOnly
            variant="ghost"
            onPress={onBack}
            aria-label="رجوع"
            className="size-9 shrink-0 rounded-full"
          >
            <ArrowRight className="size-5" />
          </Button>
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <ProductKindIconBadge kind={kind} size="sm" />
            <div className="min-w-0">
              <h3 className="truncate text-base font-bold">{catalogItem.label}</h3>
              <p className="truncate text-xs text-muted">
                {storeCategoryName
                  ? `متجر ${storeCategoryName}`
                  : catalogItem.description}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <div
        className={cn(
          'min-h-0 flex-1 overscroll-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [-webkit-overflow-scrolling:touch]',
          isPageLayout ? 'px-4 py-6 sm:px-6 sm:py-8' : 'overflow-y-auto px-5 py-4',
        )}
      >
        <div className={cn(isPageLayout ? 'space-y-5' : 'space-y-4')}>
          {isPageLayout ? (
            <header className="mb-1">
              <ProductCreatePill label={catalogItem.label} />
              <h2 className="mt-3 text-lg font-bold tracking-tight sm:text-xl">
                تفاصيل المنتج
              </h2>
              {storeCategoryName ? (
                <p className="mt-1 text-xs text-muted">متجر {storeCategoryName}</p>
              ) : null}
            </header>
          ) : null}

          <ProductImagesUpload
            images={images}
            uploading={uploadingAssets}
            onPick={handlePickImages}
            onRemove={handleRemoveImage}
            maxImages={5}
          />

          <ProductFormSection
            title="المعلومات الأساسية"
            description="الاسم والوصف كما يظهران في متجرك"
          >
            <TextField
              value={name}
              onChange={setName}
              className="flex flex-col gap-2"
            >
              <Label className="text-xs font-medium text-muted">اسم المنتج</Label>
              <Input placeholder={categoryUi.namePlaceholder} />
            </TextField>

            <TextField
              value={description}
              onChange={setDescription}
              className="flex flex-col gap-2"
            >
              <Label className="text-xs font-medium text-muted">الوصف</Label>
              <TextArea
                placeholder={categoryUi.descriptionPlaceholder}
                rows={mobile ? 3 : 4}
                className="min-h-[5.5rem] resize-none"
              />
            </TextField>
          </ProductFormSection>

          <ProductFormSection title="التسعير والمخزون">
            <div
              className={cn(
                'grid gap-4',
                kind === 'PHYSICAL' && !useVariants ? 'grid-cols-2' : 'grid-cols-1',
              )}
            >
              <ProductPriceField value={price} onChange={setPrice} />

              {kind === 'PHYSICAL' && !useVariants ? (
                <TextField
                  value={quantity}
                  onChange={setQuantity}
                  className="flex flex-col gap-2"
                >
                  <Label className="text-xs font-medium text-muted">الكمية</Label>
                  <Input type="number" min={0} />
                </TextField>
              ) : null}
            </div>

            {kind === 'PHYSICAL' ? (
              <TextField value={sku} onChange={setSku} className="flex flex-col gap-2">
                <Label className="text-xs font-medium text-muted">SKU (اختياري)</Label>
                <Input />
              </TextField>
            ) : null}
          </ProductFormSection>

          {templateLoading ? (
            <Card variant="secondary" className="gap-3 p-4">
              <Skeleton className="h-4 w-32 rounded-lg" />
              <Skeleton className="h-10 w-full rounded-xl" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </Card>
          ) : templateLoadError ? (
            <Alert status="danger">
              <Alert.Indicator />
              <Alert.Content>
                <Alert.Description>
                  تعذّر تحميل حقول التصنيف: {templateLoadError}
                </Alert.Description>
              </Alert.Content>
            </Alert>
          ) : !baseTemplate ? (
            <Card variant="secondary" className="border border-dashed border-border p-5 text-center shadow-none">
              <Card.Title className="text-sm font-bold">
                لم يُحدَّد تصنيف لمتجرك بعد
              </Card.Title>
              <Card.Description className="mt-2 text-xs leading-relaxed">
                من حسابات ركني → إعداد الملف الشخصي → اختر تصنيف نشاطك (مثل الأزياء).
                إذا سبق واخترته، حدّث الصفحة بعد إعادة تسجيل الدخول.
              </Card.Description>
            </Card>
          ) : templateFields.length > 0 ? (
            <ProductTemplateFields
              fields={templateFields}
              values={templateValues}
              onChange={handleTemplateValueChange}
              title={categoryUi.sectionTitle}
              description={categoryUi.sectionDescription}
            />
          ) : null}

          {categoryKindHint ? (
            <p className="text-xs text-muted">{categoryKindHint}</p>
          ) : null}

          {kind === 'PHYSICAL' &&
          template?.hasVariants &&
          template.variantAttributes?.length ? (
            <ProductVariantsForm
              variantAttributes={template.variantAttributes}
              variants={variants}
              onChange={setVariants}
            />
          ) : null}

          {showLegacyServiceFields ? (
            <ProductFormSection title="تفاصيل الخدمة">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Select
                  selectedKey={serviceType}
                  onSelectionChange={(key) => setServiceType(String(key ?? 'consultation'))}
                  className="flex flex-col gap-2"
                >
                  <Label className="text-xs font-medium text-muted">نوع الخدمة</Label>
                  <Select.Trigger>
                    <Select.Value />
                    <Select.Indicator />
                  </Select.Trigger>
                  <Select.Popover>
                    <ListBox>
                      {SERVICE_TYPE_OPTIONS.map((option) => (
                        <ListBox.Item
                          key={option.value}
                          id={option.value}
                          textValue={option.label}
                        >
                          {option.label}
                          <ListBox.ItemIndicator />
                        </ListBox.Item>
                      ))}
                    </ListBox>
                  </Select.Popover>
                </Select>

                <Select
                  selectedKey={deliveryMethod}
                  onSelectionChange={(key) => setDeliveryMethod(String(key ?? 'online'))}
                  className="flex flex-col gap-2"
                >
                  <Label className="text-xs font-medium text-muted">طريقة التقديم</Label>
                  <Select.Trigger>
                    <Select.Value />
                    <Select.Indicator />
                  </Select.Trigger>
                  <Select.Popover>
                    <ListBox>
                      {DELIVERY_METHOD_OPTIONS.map((option) => (
                        <ListBox.Item
                          key={option.value}
                          id={option.value}
                          textValue={option.label}
                        >
                          {option.label}
                          <ListBox.ItemIndicator />
                        </ListBox.Item>
                      ))}
                    </ListBox>
                  </Select.Popover>
                </Select>

                <TextField
                  value={serviceDuration}
                  onChange={setServiceDuration}
                  className="flex flex-col gap-2 sm:col-span-2"
                >
                  <Label className="text-xs font-medium text-muted">المدة (اختياري)</Label>
                  <Input placeholder="مثال: 60 دقيقة" />
                </TextField>
              </div>
            </ProductFormSection>
          ) : null}

          {kind === 'DIGITAL' ? (
            <ProductFormSection
              title="ملف المنتج الرقمي"
              description="يُسلّم للعميل بعد الشراء"
            >
              <Card variant="default" className="gap-0 border border-dashed border-border p-0 shadow-none">
                <Card.Content className="flex-row items-center gap-3 p-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-surface-secondary text-muted">
                    <Upload className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <Card.Title className="truncate text-[13px] font-medium">
                      {digitalFile?.name ?? 'اختر ملف PDF أو ZIP أو فيديو'}
                    </Card.Title>
                  </div>
                  <input
                    type="file"
                    accept=".pdf,.zip,.mp4,.mp3,application/pdf,application/zip,video/mp4,audio/mpeg"
                    onChange={(e) => setDigitalFile(e.target.files?.[0] ?? null)}
                    className="max-w-[6.5rem] text-[11px] text-muted"
                  />
                </Card.Content>
              </Card>
            </ProductFormSection>
          ) : null}

          {error ? (
            <Alert status="danger">
              <Alert.Indicator />
              <Alert.Content>
                <Alert.Description>{error}</Alert.Description>
              </Alert.Content>
            </Alert>
          ) : null}
        </div>
      </div>

      {!isPageLayout ? (
        <div className="flex shrink-0 gap-2 border-t border-border/70 px-5 py-4">
          <Button
            type="submit"
            isDisabled={isBusy || templateLoading}
            className="h-11 min-w-0 flex-1 rounded-2xl font-semibold"
          >
            {isBusy ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              'إنشاء المنتج'
            )}
          </Button>
        </div>
      ) : null}
    </form>
  );
}
