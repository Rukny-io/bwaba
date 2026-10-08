'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import Image from 'next/image';
import { Check, Loader2, Package, Trash2 } from 'lucide-react';
import { Alert, Button } from '@heroui/react';
import { CollectionImageUpload } from '@/components/products/collections/collection-image-upload';
import { ApiException } from '@/lib/api-client';
import {
  deleteCollection,
  fetchMyStoreProducts,
  getProductDisplayName,
  updateCollection,
} from '@/lib/collections/api';
import type { MyStoreProduct, ProductCollection } from '@/lib/collections/types';
import { formatProductPrice, getProductImage } from '@/lib/collections/product-utils';
import { formatNumber } from '@/lib/dashboard-format';
import { formatProductDate } from '@/lib/products/product-display';
import { useTranslations } from '@/lib/i18n';
import { uploadStorageImage } from '@/lib/storage/upload';
import { cn } from '@/lib/utils';

interface EditCollectionFormProps {
  collection: ProductCollection;
  onUpdated?: () => void;
  onDeleted?: () => void;
  onCancel?: () => void;
  className?: string;
}

function MetaItem({ label, value }: { label: string; value: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
      <span className="text-[11px] text-[var(--muted-foreground)]">{label}</span>
      <span
        dir="auto"
        className="text-[12px] font-medium tabular-nums text-[var(--foreground)]"
      >
        {value}
      </span>
    </span>
  );
}

export function EditCollectionForm({
  collection,
  onUpdated,
  onDeleted,
  onCancel,
  className,
}: EditCollectionFormProps) {
  const { t } = useTranslations();
  const [nameAr, setNameAr] = useState(collection.nameAr?.trim() || collection.name);
  const [description, setDescription] = useState(collection.description ?? '');
  const [imagePath, setImagePath] = useState<string | null>(collection.imagePath ?? null);
  const [bannerPath, setBannerPath] = useState<string | null>(collection.bannerPath ?? null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>(collection.productIds);
  const [products, setProducts] = useState<MyStoreProduct[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (imagePreview?.startsWith('blob:')) URL.revokeObjectURL(imagePreview);
      if (bannerPreview?.startsWith('blob:')) URL.revokeObjectURL(bannerPreview);
    };
  }, [bannerPreview, imagePreview]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoadingProducts(true);
      try {
        const rows = await fetchMyStoreProducts();
        if (!cancelled) {
          setProducts(rows.filter((product) => product.status !== 'DISCONTINUED'));
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiException ? err.message : t('collections.loadProductsFailed'),
          );
        }
      } finally {
        if (!cancelled) setLoadingProducts(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [t]);

  const filteredProducts = useMemo(() => {
    const query = productSearch.trim().toLowerCase();
    if (!query) return products;

    return products.filter((product) => {
      const label = getProductDisplayName(product).toLowerCase();
      return label.includes(query);
    });
  }, [products, productSearch]);

  const isUploading = uploadingImage || uploadingBanner;
  const isBusy = saving || deleting || isUploading;

  function toggleProduct(productId: string) {
    setSelectedProductIds((current) =>
      current.includes(productId)
        ? current.filter((id) => id !== productId)
        : [...current, productId],
    );
  }

  async function handleImagePick(file: File) {
    setError(null);
    const preview = URL.createObjectURL(file);
    setImagePreview((current) => {
      if (current?.startsWith('blob:')) URL.revokeObjectURL(current);
      return preview;
    });
    setUploadingImage(true);

    try {
      const key = await uploadStorageImage(file, 'LOGO');
      setImagePath(key);
    } catch (err) {
      setImagePath(collection.imagePath ?? null);
      setImagePreview((current) => {
        if (current?.startsWith('blob:')) URL.revokeObjectURL(current);
        return null;
      });
      setError(err instanceof Error ? err.message : t('collections.logoUploadFailed'));
    } finally {
      setUploadingImage(false);
    }
  }

  async function handleBannerPick(file: File) {
    setError(null);
    const preview = URL.createObjectURL(file);
    setBannerPreview((current) => {
      if (current?.startsWith('blob:')) URL.revokeObjectURL(current);
      return preview;
    });
    setUploadingBanner(true);

    try {
      const key = await uploadStorageImage(file, 'BANNER');
      setBannerPath(key);
    } catch (err) {
      setBannerPath(collection.bannerPath ?? null);
      setBannerPreview((current) => {
        if (current?.startsWith('blob:')) URL.revokeObjectURL(current);
        return null;
      });
      setError(err instanceof Error ? err.message : t('collections.bannerUploadFailed'));
    } finally {
      setUploadingBanner(false);
    }
  }

  function clearImage() {
    setImagePath(null);
    setImagePreview((current) => {
      if (current?.startsWith('blob:')) URL.revokeObjectURL(current);
      return null;
    });
  }

  function clearBanner() {
    setBannerPath(null);
    setBannerPreview((current) => {
      if (current?.startsWith('blob:')) URL.revokeObjectURL(current);
      return null;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmedName = nameAr.trim();
    if (trimmedName.length < 2) {
      setError(t('collections.nameRequired'));
      return;
    }

    if (isUploading) {
      setError(t('collections.waitUploads'));
      return;
    }

    setSaving(true);
    try {
      await updateCollection(collection.id, {
        nameAr: trimmedName,
        description: description.trim() || undefined,
        imagePath: imagePath ?? undefined,
        bannerPath: bannerPath ?? undefined,
        productIds: selectedProductIds,
      });
      onUpdated?.();
    } catch (err) {
      setError(
        err instanceof ApiException ? err.message : t('collections.saveFailed'),
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setError(null);
    setDeleting(true);
    try {
      await deleteCollection(collection.id);
      onDeleted?.();
    } catch (err) {
      setError(
        err instanceof ApiException ? err.message : t('collections.deleteFailed'),
      );
      setConfirmDelete(false);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn('flex min-h-0 flex-1 flex-col overflow-hidden', className)}
    >
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="grid min-w-0 gap-4 p-4 sm:grid-cols-[12rem_minmax(0,1fr)] sm:gap-5 sm:p-5">
          <div className="flex min-w-0 flex-col gap-2.5">
            <CollectionImageUpload
              variant="thumbnail"
              layout="panel"
              value={imagePath}
              previewUrl={imagePreview}
              uploading={uploadingImage}
              onPick={handleImagePick}
              onRemove={clearImage}
            />

            <CollectionImageUpload
              variant="banner"
              layout="panel"
              value={bannerPath}
              previewUrl={bannerPreview}
              uploading={uploadingBanner}
              onPick={handleBannerPick}
              onRemove={clearBanner}
            />
          </div>

          <div className="flex min-w-0 flex-col gap-3.5">
            <div className="flex flex-col gap-1">
              <p
                id="edit-collection-title"
                className="text-[11px] font-medium text-[var(--muted-foreground)]"
              >
                {t('collections.editCollection')}
              </p>
              <input
                value={nameAr}
                onChange={(e) => setNameAr(e.target.value)}
                placeholder={t('collections.namePlaceholder')}
                dir="auto"
                className="w-full border-0 bg-transparent p-0 text-[18px] font-semibold leading-snug tracking-tight text-[var(--foreground)] outline-none placeholder:text-[var(--muted-foreground)]/60"
              />
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('collections.descriptionPlaceholder')}
                dir="auto"
                className="w-full border-0 bg-transparent p-0 text-[13px] leading-relaxed text-[var(--muted-foreground)] outline-none placeholder:text-[var(--muted-foreground)]/60"
              />
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 py-0.5">
              <MetaItem
                label={t('collections.status')}
                value={
                  collection.isActive
                    ? t('collections.statusActive')
                    : t('collections.statusInactive')
                }
              />
              <MetaItem
                label={t('collections.productsLabel')}
                value={formatNumber(selectedProductIds.length)}
              />
              <MetaItem
                label={t('collections.createdAt')}
                value={formatProductDate(collection.createdAt) ?? '—'}
              />
            </div>

            <section className="flex min-h-0 flex-col gap-2.5">
              <p className="text-[11px] font-medium text-[var(--muted-foreground)]">
                {t('collections.collectionProducts')}
              </p>

              <input
                type="search"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder={t('collections.searchProducts')}
                className="h-9 w-full rounded-lg bg-[var(--surface-secondary)] px-3 text-[12px] text-[var(--foreground)] outline-none placeholder:text-[var(--muted-foreground)]/60 focus:ring-2 focus:ring-[var(--foreground)]/8"
              />

              {loadingProducts ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="size-5 animate-spin text-[var(--muted-foreground)]" />
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="rounded-xl bg-[var(--surface-secondary)]/50 py-10 text-center">
                  <Package
                    className="mx-auto mb-2 size-6 text-[var(--muted-foreground)]/60"
                    strokeWidth={1.5}
                  />
                  <p className="text-[13px] text-[var(--muted-foreground)]">
                    {t('collections.noProducts')}
                  </p>
                </div>
              ) : (
                <div className="flex max-h-[14rem] flex-col overflow-y-auto rounded-xl bg-[var(--surface-secondary)]/40">
                  {filteredProducts.map((product) => {
                    const selected = selectedProductIds.includes(product.id);
                    const imageUrl = getProductImage(product);

                    return (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => toggleProduct(product.id)}
                        className="flex w-full items-center gap-3 px-3 py-2.5 text-right transition-colors hover:bg-[var(--surface-secondary)]"
                      >
                        <div
                          className={cn(
                            'flex size-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                            selected
                              ? 'border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)]'
                              : 'border-[var(--border)] bg-transparent',
                          )}
                        >
                          {selected ? (
                            <Check className="size-3" strokeWidth={2.5} />
                          ) : null}
                        </div>

                        <div className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-[var(--surface-secondary)]">
                          {imageUrl ? (
                            <Image
                              src={imageUrl}
                              alt=""
                              fill
                              sizes="40px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center">
                              <Package className="size-4 text-[var(--muted-foreground)]" />
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p
                            dir="auto"
                            className="truncate text-[13px] font-medium text-[var(--foreground)]"
                          >
                            {getProductDisplayName(product)}
                          </p>
                          <p className="mt-0.5 text-[12px] text-[var(--muted-foreground)]">
                            {formatProductPrice(product.price)}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>

            {error ? (
              <Alert status="danger">
                <Alert.Indicator />
                <Alert.Content>
                  <Alert.Description>{error}</Alert.Description>
                </Alert.Content>
              </Alert>
            ) : null}

            <div className="flex items-stretch gap-2 pt-1">
              <Button
                type="submit"
                variant="secondary"
                isDisabled={isBusy}
                className="h-10 min-w-0 flex-1 rounded-xl text-[13px] font-medium !shadow-none"
              >
                {saving ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : (
                  t('collections.save')
                )}
              </Button>

              <Button
                type="button"
                variant={confirmDelete ? 'danger' : 'danger-soft'}
                isDisabled={saving || isUploading || deleting}
                onPress={() => {
                  if (confirmDelete) {
                    void handleDelete();
                    return;
                  }
                  setConfirmDelete(true);
                }}
                className="h-10 min-w-0 flex-1 gap-1.5 rounded-xl text-[13px] font-medium !shadow-none"
              >
                {deleting ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : (
                  <>
                    <Trash2 className="size-3.5" strokeWidth={2} aria-hidden />
                    {confirmDelete ? t('collections.confirmDelete') : t('collections.delete')}
                  </>
                )}
              </Button>

              {onCancel ? (
                <Button
                  type="button"
                  variant="ghost"
                  isDisabled={isBusy}
                  onPress={() => {
                    if (confirmDelete) {
                      setConfirmDelete(false);
                      return;
                    }
                    onCancel();
                  }}
                  className="h-10 shrink-0 rounded-xl px-4 text-[13px] font-medium !shadow-none"
                >
                  {confirmDelete ? t('collections.undo') : t('collections.cancel')}
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
