'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { Check, Loader2, Package, Trash2 } from 'lucide-react';
import { Alert } from '@heroui/react';
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
import { uploadStorageImage } from '@/lib/storage/upload';
import { cn } from '@/lib/utils';

interface EditCollectionFormProps {
  collection: ProductCollection;
  onUpdated?: () => void;
  onDeleted?: () => void;
  onCancel?: () => void;
  className?: string;
}

export function EditCollectionForm({
  collection,
  onUpdated,
  onDeleted,
  onCancel,
  className,
}: EditCollectionFormProps) {
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
            err instanceof ApiException ? err.message : 'تعذّر تحميل المنتجات',
          );
        }
      } finally {
        if (!cancelled) setLoadingProducts(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

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
      setError(err instanceof Error ? err.message : 'تعذّر رفع صورة الشعار');
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
      setError(err instanceof Error ? err.message : 'تعذّر رفع صورة الخلفية');
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
      setError('أدخل اسماً للمجموعة (حرفان على الأقل)');
      return;
    }

    if (isUploading) {
      setError('انتظر حتى يكتمل رفع الصور');
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
        err instanceof ApiException ? err.message : 'تعذّر حفظ التعديلات',
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
        err instanceof ApiException ? err.message : 'تعذّر حذف المجموعة',
      );
      setConfirmDelete(false);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn('flex min-h-0 flex-1 flex-col', className)}
    >
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="flex flex-col gap-4 px-4 py-4">
          <CollectionImageUpload
            variant="banner"
            value={bannerPath}
            previewUrl={bannerPreview}
            uploading={uploadingBanner}
            onPick={handleBannerPick}
            onRemove={clearBanner}
          />

          <div className="flex items-start gap-3 border-b border-[rgba(34,34,34,0.08)] pb-4 dark:border-white/10">
            <CollectionImageUpload
              variant="thumbnail"
              value={imagePath}
              previewUrl={imagePreview}
              uploading={uploadingImage}
              onPick={handleImagePick}
              onRemove={clearImage}
            />

            <div className="min-w-0 flex-1 space-y-2.5 pt-1">
              <input
                value={nameAr}
                onChange={(e) => setNameAr(e.target.value)}
                placeholder="اسم المجموعة"
                className="w-full border-0 bg-transparent p-0 text-[15px] font-medium text-[var(--foreground)] outline-none placeholder:text-[var(--muted-foreground)]/75"
              />
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="وصف اختياري"
                className="w-full border-0 bg-transparent p-0 text-[12px] text-[var(--muted-foreground)] outline-none placeholder:text-[var(--muted-foreground)]/65"
              />
            </div>
          </div>

          <section className="flex min-h-0 flex-col">
            <p className="mb-3 text-[12px] text-[var(--muted-foreground)]">
              منتجات المجموعة
            </p>

            <input
              type="search"
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              placeholder="بحث…"
              className="mb-3 h-9 w-full rounded-lg border border-[rgba(34,34,34,0.1)] bg-transparent px-3 text-[12px] text-[var(--foreground)] outline-none placeholder:text-[var(--muted-foreground)]/60 focus:border-[rgba(34,34,34,0.18)] dark:border-white/10 dark:focus:border-white/20"
            />

            {loadingProducts ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="size-5 animate-spin text-[var(--muted-foreground)]" />
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="py-10 text-center">
                <Package
                  className="mx-auto mb-2 size-6 text-[var(--muted-foreground)]/60"
                  strokeWidth={1.5}
                />
                <p className="text-[13px] text-[var(--muted-foreground)]">
                  لا توجد منتجات
                </p>
              </div>
            ) : (
              <div className="flex max-h-[12rem] flex-col overflow-y-auto">
                {filteredProducts.map((product) => {
                  const selected = selectedProductIds.includes(product.id);
                  const imageUrl = getProductImage(product);

                  return (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => toggleProduct(product.id)}
                      className="flex w-full items-center gap-3 border-b border-[rgba(34,34,34,0.08)] py-3 text-right transition-colors last:border-b-0 hover:bg-black/[0.02] dark:border-white/10 dark:hover:bg-white/[0.03]"
                    >
                      <div
                        className={cn(
                          'flex size-7 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                          selected
                            ? 'border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)]'
                            : 'border-[rgba(34,34,34,0.18)] bg-transparent dark:border-white/20',
                        )}
                      >
                        {selected ? <Check className="size-3.5" strokeWidth={2.5} /> : null}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-medium text-[var(--foreground)]">
                          {getProductDisplayName(product)}
                        </p>
                        <p className="mt-0.5 text-[12px] text-[var(--muted-foreground)]">
                          {formatProductPrice(product.price)}
                        </p>
                      </div>

                      <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-[var(--surface-secondary)]">
                        {imageUrl ? (
                          <Image
                            src={imageUrl}
                            alt=""
                            fill
                            sizes="48px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <Package className="size-4 text-[var(--muted-foreground)]" />
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>

      {error ? (
        <div className="shrink-0 px-4 pb-2">
          <Alert status="danger">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Description>{error}</Alert.Description>
            </Alert.Content>
          </Alert>
        </div>
      ) : null}

      <div className="flex shrink-0 gap-2 border-t border-[rgba(34,34,34,0.08)] px-4 py-3 dark:border-white/10">
        <button
          type="submit"
          disabled={isBusy}
          className="inline-flex h-10 min-w-0 flex-1 items-center justify-center rounded-lg bg-[var(--primary)] px-4 text-[13px] font-semibold text-[var(--primary-foreground)] transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {saving ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <span>حفظ التعديلات</span>
          )}
        </button>

        <button
          type="button"
          disabled={saving || isUploading}
          onClick={() => {
            if (confirmDelete) {
              void handleDelete();
              return;
            }
            setConfirmDelete(true);
          }}
          className={cn(
            'inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-lg px-3.5 text-[13px] font-semibold transition-opacity disabled:opacity-60',
            confirmDelete
              ? 'bg-[var(--danger)] text-white hover:opacity-90'
              : 'border border-[var(--danger)]/35 text-[var(--danger)] hover:bg-[var(--danger)]/5',
          )}
        >
          {deleting ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <>
              <Trash2 className="size-3.5" strokeWidth={1.75} aria-hidden />
              <span>{confirmDelete ? 'تأكيد الحذف' : 'حذف'}</span>
            </>
          )}
        </button>

        {onCancel ? (
          <button
            type="button"
            onClick={() => {
              if (confirmDelete) {
                setConfirmDelete(false);
                return;
              }
              onCancel();
            }}
            disabled={isBusy}
            className="inline-flex h-10 shrink-0 items-center justify-center rounded-lg border border-[rgba(34,34,34,0.12)] px-4 text-[13px] font-medium text-[var(--foreground)] transition-colors hover:bg-black/[0.03] disabled:opacity-60 dark:border-white/15 dark:hover:bg-white/[0.05]"
          >
            {confirmDelete ? 'تراجع' : 'إلغاء'}
          </button>
        ) : null}
      </div>
    </form>
  );
}
