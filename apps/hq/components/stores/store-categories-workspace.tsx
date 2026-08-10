'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowLeft, Pencil, Plus, Trash2 } from 'lucide-react';
import { Button, Chip, EmptyState, Table } from '@heroui/react';
import type { AdminStoreCategory } from '@/lib/types/stores';
import { hqApi } from '@/lib/hq-api';
import { appToast } from '@/lib/app-toast';
import { ApiException } from '@/lib/api-client';
import { formatCategoryLabel } from '@/lib/stores-format';
import { StoreCategoryFormDialog } from '@/components/stores/store-category-form-dialog';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { cn } from '@/lib/utils';

export function StoreCategoriesWorkspace() {
  const [categories, setCategories] = useState<AdminStoreCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AdminStoreCategory | null>(null);
  const [deleting, setDeleting] = useState<AdminStoreCategory | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  async function loadCategories() {
    setLoading(true);
    try {
      const data = await hqApi.getStoreCategories();
      setCategories(data);
    } catch (error) {
      appToast.error(
        error instanceof ApiException ? error.message : 'Could not load categories',
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadCategories();
  }, []);

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(category: AdminStoreCategory) {
    setEditing(category);
    setDialogOpen(true);
  }

  async function handleDelete() {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      await hqApi.deleteStoreCategory(deleting.id);
      appToast.success('Category deleted');
      setDeleting(null);
      await loadCategories();
    } catch (error) {
      appToast.error(
        error instanceof ApiException ? error.message : 'Could not delete category',
      );
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <div className="dashboard-section-stack">
      <Link
        href="/app/stores"
        className="inline-flex items-center gap-1 rounded-lg py-0.5 text-xs font-medium text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
      >
        <ArrowLeft className="size-3.5" />
        Stores
      </Link>

      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[var(--foreground)] sm:text-2xl">
            Store categories
          </h1>
          <p className="mt-1 text-[13px] text-[var(--muted-foreground)] sm:text-sm">
            Platform taxonomy used when merchants register — defines product template fields.
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          className="h-10 shrink-0 rounded-xl"
          onPress={openCreate}
        >
          <Plus className="size-4" />
          Add category
        </Button>
      </header>

      <div className="dashboard-card overflow-hidden rounded-2xl sm:rounded-3xl">
        <Table className="p-4">
          <Table.ScrollContainer>
            <Table.Content aria-label="Store categories" className="w-full">
              <Table.Header>
                <Table.Column
                  id="name"
                  isRowHeader
                  className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]"
                >
                  Category
                </Table.Column>
                <Table.Column
                  id="slug"
                  className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]"
                >
                  Slug
                </Table.Column>
                <Table.Column
                  id="stores"
                  className="text-end text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]"
                >
                  Stores
                </Table.Column>
                <Table.Column
                  id="order"
                  className="text-end text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]"
                >
                  Order
                </Table.Column>
                <Table.Column
                  id="status"
                  className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]"
                >
                  Status
                </Table.Column>
                <Table.Column
                  id="actions"
                  className="text-end text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]"
                >
                  Actions
                </Table.Column>
              </Table.Header>

              {loading ? (
                <Table.Body>
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Table.Row key={`loading-${index}`} id={`loading-${index}`}>
                      {Array.from({ length: 6 }).map((__, cellIndex) => (
                        <Table.Cell key={cellIndex}>
                          <div className="h-4 animate-pulse rounded-md bg-[var(--surface-secondary)]" />
                        </Table.Cell>
                      ))}
                    </Table.Row>
                  ))}
                </Table.Body>
              ) : (
                <Table.Body
                  items={categories}
                  renderEmptyState={() => (
                    <EmptyState className="py-12">
                      <p className="text-sm font-medium text-[var(--foreground)]">
                        No categories yet
                      </p>
                      <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                        Add a category to define store taxonomy and product templates.
                      </p>
                    </EmptyState>
                  )}
                >
                  {(category) => (
                    <Table.Row id={category.id} textValue={category.name}>
                      <Table.Cell>
                        <div className="flex items-center gap-2.5">
                          <span
                            className="size-3 shrink-0 rounded-full"
                            style={{ backgroundColor: category.color }}
                            aria-hidden
                          />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-[var(--foreground)]">
                              {formatCategoryLabel(category)}
                            </p>
                            {category.description ? (
                              <p className="truncate text-xs text-[var(--muted-foreground)]">
                                {category.description}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      </Table.Cell>
                      <Table.Cell>
                        <span className="font-mono text-xs text-[var(--muted-foreground)]" dir="ltr">
                          {category.slug}
                        </span>
                      </Table.Cell>
                      <Table.Cell className="text-end">
                        <span className="text-sm tabular-nums text-[var(--foreground)]">
                          {category._count.stores}
                        </span>
                      </Table.Cell>
                      <Table.Cell className="text-end">
                        <span className="text-sm tabular-nums text-[var(--foreground)]">
                          {category.order}
                        </span>
                      </Table.Cell>
                      <Table.Cell>
                        <Chip
                          color={category.isActive ? 'success' : 'default'}
                          size="sm"
                          variant="soft"
                        >
                          {category.isActive ? 'Active' : 'Inactive'}
                        </Chip>
                      </Table.Cell>
                      <Table.Cell>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="tertiary"
                            className={cn('h-8 rounded-lg px-2')}
                            onPress={() => openEdit(category)}
                          >
                            <Pencil className="size-3.5" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="tertiary"
                            className="h-8 rounded-lg px-2 text-[var(--danger)]"
                            onPress={() => setDeleting(category)}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </Table.Cell>
                    </Table.Row>
                  )}
                </Table.Body>
              )}
            </Table.Content>
          </Table.ScrollContainer>
        </Table>
      </div>

      <StoreCategoryFormDialog
        isOpen={dialogOpen}
        onOpenChange={setDialogOpen}
        category={editing}
        onSaved={() => void loadCategories()}
      />

      <ConfirmDialog
        isOpen={Boolean(deleting)}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        title="Delete category?"
        description={
          deleting
            ? deleting._count.stores > 0
              ? `"${deleting.name}" has ${deleting._count.stores} linked store(s). Deleting may fail if stores still reference it.`
              : `Permanently delete "${deleting.name}"?`
            : ''
        }
        confirmLabel="Delete"
        variant="danger"
        isLoading={deleteLoading}
        onConfirm={handleDelete}
      />
    </div>
  );
}
