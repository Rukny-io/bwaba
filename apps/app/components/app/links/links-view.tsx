'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AnimatePresence, Reorder, motion } from 'framer-motion';
import { Link2, Loader2, Plus } from 'lucide-react';
import { AddLinkCatalogDialog } from '@/components/app/links/add-link-catalog/add-link-catalog-dialog';
import { AddLinkMobileDialog } from '@/components/app/links/add-link-catalog/add-link-mobile-dialog';
import { CreateLinkGroupDialog } from '@/components/app/links/create-link-group-dialog';
import { DashboardPageHeader } from '@/components/app/dashboard-page-header';
import { LinkGroupHeader } from '@/components/app/links/link-group-header';
import { LinksPageActions } from '@/components/app/links/links-page-actions';
import { useProfilePreviewRefresh, useProfilePreviewSync } from '@/components/app/links/profile-preview-provider';
import { SortableLinkCard } from '@/components/app/links/sortable-link-card';
import { ApiException } from '@/lib/api-client';
import { fetchMyProfile } from '@/lib/profile/api';
import type { MyProfile } from '@/lib/profile/types';
import {
  createLink,
  createLinkGroup,
  deleteLink,
  deleteLinkGroup,
  fetchLinkGroups,
  fetchMyLinks,
  moveLinksToGroup,
  reorderLinks,
  updateLink,
  updateLinkGroup,
} from '@/lib/links/api';
import { getLinkDisplayLabel } from '@/lib/links/resolve-platform';
import type {
  CreateSocialLinkInput,
  LinkGroup,
  SocialLink,
  UpdateSocialLinkInput,
} from '@/lib/links/types';
import { linksActionButtonClass } from '@/components/app/links/links-interaction';
import { useTranslations } from '@/lib/i18n';
import { cn } from '@/lib/utils';

function sortLinks(a: SocialLink, b: SocialLink) {
  const pinDiff = Number(b.isPinned) - Number(a.isPinned);
  if (pinDiff !== 0) return pinDiff;
  return a.displayOrder - b.displayOrder;
}

export function LinksView() {
  const { t } = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [links, setLinks] = useState<SocialLink[]>([]);
  const [groups, setGroups] = useState<LinkGroup[]>([]);
  const [profile, setProfile] = useState<MyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [expandedByGroup, setExpandedByGroup] = useState<Record<string, boolean>>({});
  const linksRef = useRef(links);
  const groupsRef = useRef(groups);
  const reorderStartIdsRef = useRef<string[] | null>(null);
  const refreshPreview = useProfilePreviewRefresh();

  linksRef.current = links;
  groupsRef.current = groups;

  function schedulePreviewRefresh() {
    window.setTimeout(() => {
      refreshPreview?.();
    }, 150);
  }

  const loadLinks = useCallback(async () => {
    setError(null);
    try {
      const [linksData, groupsData, profileData] = await Promise.all([
        fetchMyLinks(),
        fetchLinkGroups(),
        fetchMyProfile(),
      ]);
      setLinks(linksData);
      setGroups(groupsData.sort((a, b) => a.order - b.order));
      setExpandedByGroup((prev) => {
        const next: Record<string, boolean> = {};
        for (const group of groupsData) {
          next[group.id] = prev[group.id] ?? group.isExpanded;
        }
        return next;
      });
      setProfile(profileData);
    } catch (err) {
      if (err instanceof ApiException && err.statusCode === 404) {
        setError(t('linksPage.profileMissing'));
      } else {
        setError(err instanceof Error ? err.message : t('linksPage.loadFailed'));
      }
      setLinks([]);
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadLinks();
  }, [loadLinks]);

  useEffect(() => {
    if (searchParams.get('add') === '1') {
      setCatalogOpen(true);
      router.replace('/app/links', { scroll: false });
    }
  }, [searchParams, router]);

  useEffect(() => {
    const igStatus = searchParams.get('instagram');
    if (!igStatus) return;

    const linkId = searchParams.get('linkId');
    const cleanPath = '/app/links';

    if (igStatus === 'success') {
      setError(null);
      setCatalogOpen(false);
      void loadLinks();
      router.replace(cleanPath, { scroll: false });
      if (linkId) {
        router.push(`/app/links/${linkId}`);
      }
      return;
    }

    if (igStatus === 'error') {
      const reason = searchParams.get('reason');
      setError(
        reason === 'server'
          ? t('linksPage.instagramFailedPro')
          : t('linksPage.instagramFailed', {
              reason: reason ? ` (${reason})` : '',
            }),
      );
    }

    router.replace(cleanPath, { scroll: false });
  }, [searchParams, router, loadLinks, t]);

  const sortedGroups = useMemo(
    () => [...groups].sort((a, b) => a.order - b.order),
    [groups],
  );

  const ungroupedLinks = useMemo(
    () => links.filter((link) => !link.groupId).sort(sortLinks),
    [links],
  );

  const linksByGroup = useMemo(() => {
    const map = new Map<string, SocialLink[]>();
    for (const group of sortedGroups) {
      map.set(
        group.id,
        links.filter((link) => link.groupId === group.id).sort(sortLinks),
      );
    }
    return map;
  }, [links, sortedGroups]);

  function flattenOrderedIds(
    nextUngrouped: SocialLink[],
    nextByGroup: Map<string, SocialLink[]>,
  ) {
    const ids: string[] = [];
    for (const group of groupsRef.current.slice().sort((a, b) => a.order - b.order)) {
      const section = nextByGroup.get(group.id) ?? [];
      ids.push(...section.map((link) => link.id));
    }
    ids.push(...nextUngrouped.map((link) => link.id));
    return ids;
  }

  function applySectionOrder(
    sectionLinks: SocialLink[],
    groupId: string | null,
  ) {
    setLinks((prev) => {
      const other = prev.filter((link) =>
        groupId ? link.groupId !== groupId : Boolean(link.groupId),
      );
      const reindexed = sectionLinks.map((link, index) => ({
        ...link,
        displayOrder: index,
        groupId,
      }));
      return [...other, ...reindexed];
    });
  }

  async function handleCreatePayload(payload: CreateSocialLinkInput) {
    const created = await createLink(payload);
    setLinks((prev) =>
      [...prev, created].sort((a, b) => a.displayOrder - b.displayOrder),
    );
    schedulePreviewRefresh();
  }

  async function handleCreateGroup(input: {
    name: string;
    nameAr?: string;
    color: string;
  }) {
    setBusyId('group-create');
    try {
      const created = await createLinkGroup(input);
      setGroups((prev) => [...prev, created].sort((a, b) => a.order - b.order));
      setExpandedByGroup((prev) => ({ ...prev, [created.id]: true }));
      schedulePreviewRefresh();
    } catch (err) {
      throw err instanceof Error
        ? err
        : new Error(t('linksPage.createGroupFailed'));
    } finally {
      setBusyId(null);
    }
  }

  async function handleRenameGroup(group: LinkGroup, name: string) {
    setBusyId(group.id);
    try {
      const updated = await updateLinkGroup(group.id, {
        name,
        nameAr: name,
      });
      setGroups((prev) =>
        prev.map((item) => (item.id === group.id ? updated : item)),
      );
      schedulePreviewRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('linksPage.renameGroupFailed'));
    } finally {
      setBusyId(null);
    }
  }

  async function handleChangeGroupColor(group: LinkGroup, color: string) {
    setBusyId(group.id);
    try {
      const updated = await updateLinkGroup(group.id, { color });
      setGroups((prev) =>
        prev.map((item) => (item.id === group.id ? updated : item)),
      );
      schedulePreviewRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('linksPage.colorFailed'));
    } finally {
      setBusyId(null);
    }
  }

  async function handleToggleGroupExpanded(group: LinkGroup) {
    const nextExpanded = !(expandedByGroup[group.id] ?? group.isExpanded);
    setExpandedByGroup((prev) => ({ ...prev, [group.id]: nextExpanded }));
    setBusyId(group.id);
    try {
      const updated = await updateLinkGroup(group.id, {
        isExpanded: nextExpanded,
      });
      setGroups((prev) =>
        prev.map((item) => (item.id === group.id ? updated : item)),
      );
      schedulePreviewRefresh();
    } catch (err) {
      setExpandedByGroup((prev) => ({
        ...prev,
        [group.id]: !nextExpanded,
      }));
      setError(err instanceof Error ? err.message : t('linksPage.updateGroupFailed'));
    } finally {
      setBusyId(null);
    }
  }

  async function handleDeleteGroup(group: LinkGroup) {
    if (
      !window.confirm(
        t('linksPage.deleteGroupConfirm', {
          name: group.nameAr || group.name,
        }),
      )
    ) {
      return;
    }
    setBusyId(group.id);
    try {
      await deleteLinkGroup(group.id);
      setGroups((prev) => prev.filter((item) => item.id !== group.id));
      setLinks((prev) =>
        prev.map((link) =>
          link.groupId === group.id ? { ...link, groupId: null } : link,
        ),
      );
      schedulePreviewRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('linksPage.deleteGroupFailed'));
    } finally {
      setBusyId(null);
    }
  }

  async function handleMoveToGroup(link: SocialLink, groupId: string | null) {
    if (link.groupId === groupId) return;
    setBusyId(link.id);
    try {
      await moveLinksToGroup([link.id], groupId);
      setLinks((prev) =>
        prev.map((item) =>
          item.id === link.id ? { ...item, groupId } : item,
        ),
      );
      schedulePreviewRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('linksPage.moveFailed'));
    } finally {
      setBusyId(null);
    }
  }

  async function handleToggleStatus(link: SocialLink) {
    setBusyId(link.id);
    try {
      const nextStatus = link.status === 'active' ? 'hidden' : 'active';
      const updated = await updateLink(link.id, { status: nextStatus });
      setLinks((prev) => prev.map((l) => (l.id === link.id ? updated : l)));
      schedulePreviewRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('linksPage.statusFailed'));
    } finally {
      setBusyId(null);
    }
  }

  async function handleTogglePin(link: SocialLink) {
    setBusyId(link.id);
    try {
      const updated = await updateLink(link.id, { isPinned: !link.isPinned });
      setLinks((prev) => prev.map((l) => (l.id === link.id ? updated : l)));
      schedulePreviewRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('linksPage.pinFailed'));
    } finally {
      setBusyId(null);
    }
  }

  async function handleToggleNotify(link: SocialLink) {
    setBusyId(link.id);
    try {
      const updated = await updateLink(link.id, {
        notifyOnClick: !link.notifyOnClick,
      });
      setLinks((prev) => prev.map((l) => (l.id === link.id ? updated : l)));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('linksPage.notifyFailed'));
    } finally {
      setBusyId(null);
    }
  }

  async function handleQuickUpdate(link: SocialLink, patch: UpdateSocialLinkInput) {
    setBusyId(link.id);
    try {
      const updated = await updateLink(link.id, patch);
      setLinks((prev) => prev.map((l) => (l.id === link.id ? updated : l)));
      schedulePreviewRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('linksPage.saveFailed'));
      throw err;
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(link: SocialLink) {
    if (!window.confirm(t('linksPage.deleteConfirm', { name: getLinkDisplayLabel(link) }))) return;
    setBusyId(link.id);
    try {
      await deleteLink(link.id);
      setLinks((prev) => prev.filter((l) => l.id !== link.id));
      schedulePreviewRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('linksPage.deleteFailed'));
    } finally {
      setBusyId(null);
    }
  }

  function handleSectionReorder(groupId: string | null, next: SocialLink[]) {
    if (!reorderStartIdsRef.current) {
      const byGroup = new Map<string, SocialLink[]>();
      for (const group of groupsRef.current) {
        byGroup.set(
          group.id,
          linksRef.current.filter((link) => link.groupId === group.id),
        );
      }
      reorderStartIdsRef.current = flattenOrderedIds(
        linksRef.current.filter((link) => !link.groupId),
        byGroup,
      );
    }
    applySectionOrder(next, groupId);
  }

  async function handleReorderPointerUp() {
    const startIds = reorderStartIdsRef.current;
    if (!startIds) return;

    reorderStartIdsRef.current = null;
    const byGroup = new Map<string, SocialLink[]>();
    for (const group of groupsRef.current) {
      byGroup.set(
        group.id,
        linksRef.current.filter((link) => link.groupId === group.id),
      );
    }
    const nextUngrouped = linksRef.current.filter((link) => !link.groupId);
    const currentIds = flattenOrderedIds(nextUngrouped, byGroup);
    if (startIds.join() === currentIds.join()) return;

    setBusyId('reorder');
    try {
      await reorderLinks(currentIds);
      schedulePreviewRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('linksPage.reorderFailed'));
      await loadLinks();
    } finally {
      setBusyId(null);
    }
  }

  useProfilePreviewSync(profile, links);

  function renderLinkCard(link: SocialLink) {
    return (
      <SortableLinkCard
        key={link.id}
        link={link}
        busyId={busyId}
        groups={groups}
        onToggleStatus={handleToggleStatus}
        onTogglePin={handleTogglePin}
        onToggleNotify={handleToggleNotify}
        onQuickUpdate={handleQuickUpdate}
        onDelete={handleDelete}
        onMoveToGroup={handleMoveToGroup}
        onLinkUpdated={(updated) =>
          setLinks((prev) =>
            prev.map((item) => (item.id === updated.id ? updated : item)),
          )
        }
        onThumbnailError={(message) => setError(message)}
      />
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[240px] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-[var(--primary)]" />
      </div>
    );
  }

  const isEmpty = links.length === 0 && groups.length === 0;

  return (
    <section className="dashboard-page flex w-full min-w-0 flex-col gap-4 pt-5 sm:pt-6">
      <div className="rounded-xl bg-[var(--surface)] p-4 sm:p-5">
        <DashboardPageHeader
          className="mb-0"
          title={t('linksPage.title')}
          description={t('linksPage.description')}
          actions={
            <LinksPageActions
              onAdd={() => setCatalogOpen(true)}
              onAddGroup={() => setGroupDialogOpen(true)}
            />
          }
        />
      </div>

      {error ? (
        <div className="rounded-xl border border-[var(--danger)]/20 bg-[var(--danger)]/5 px-4 py-3.5">
          <p className="text-sm text-[var(--danger)]">{error}</p>
        </div>
      ) : null}

      {isEmpty ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)] px-4 py-16 text-center sm:py-20">
          <div className="mb-3 flex size-12 items-center justify-center rounded-xl bg-[var(--surface-secondary)] text-[var(--muted-foreground)]">
            <Link2 className="size-5" strokeWidth={1.75} aria-hidden />
          </div>
          <p className="text-sm font-semibold text-[var(--foreground)] sm:text-base">
            {t('linksPage.emptyTitle')}
          </p>
          <p className="mt-1 max-w-sm text-xs text-[var(--muted-foreground)] sm:text-sm">
            {t('linksPage.emptyHint')}
          </p>
          <button
            type="button"
            onClick={() => setCatalogOpen(true)}
            className={cn(
              'mt-5 inline-flex h-10 items-center gap-2 rounded-xl px-4',
              'text-sm font-semibold text-[var(--primary-foreground)]',
              'bg-[var(--primary)] hover:opacity-95',
              linksActionButtonClass,
            )}
          >
            <Plus className="size-4" strokeWidth={2.5} aria-hidden />
            {t('linksPage.addLink')}
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="rounded-xl bg-[var(--surface)] px-4 py-3 sm:px-5">
            <p className="text-xs leading-relaxed text-[var(--muted-foreground)] sm:text-sm">
              {t('linksPage.reorderHint')}
            </p>
          </div>

          {sortedGroups.map((group) => {
            const sectionLinks = linksByGroup.get(group.id) ?? [];
            const expanded = expandedByGroup[group.id] ?? group.isExpanded;
            return (
              <div
                key={group.id}
                className="flex flex-col gap-3 rounded-xl bg-[var(--surface)] p-3 sm:p-4"
              >
                <LinkGroupHeader
                  group={group}
                  expanded={expanded}
                  linkCount={sectionLinks.length}
                  busy={busyId === group.id}
                  onToggleExpanded={() => void handleToggleGroupExpanded(group)}
                  onRename={(name) => handleRenameGroup(group, name)}
                  onChangeColor={(color) => handleChangeGroupColor(group, color)}
                  onDelete={() => void handleDeleteGroup(group)}
                />
                <AnimatePresence initial={false}>
                  {expanded ? (
                    <motion.div
                      key={`${group.id}-links`}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="pt-1">
                        {sectionLinks.length > 0 ? (
                          <Reorder.Group
                            axis="y"
                            as="ul"
                            values={sectionLinks}
                            onReorder={(next) => handleSectionReorder(group.id, next)}
                            onPointerUp={() => void handleReorderPointerUp()}
                            className="flex list-none flex-col gap-3 p-0 sm:gap-3.5"
                          >
                            {sectionLinks.map((link) => renderLinkCard(link))}
                          </Reorder.Group>
                        ) : (
                          <p className="rounded-xl border border-dashed border-[var(--border)] px-3 py-4 text-center text-xs text-[var(--muted-foreground)]">
                            {t('linksPage.groupEmpty')}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            );
          })}

          <div className="flex flex-col gap-3 rounded-xl bg-[var(--surface)] p-3 sm:p-4">
            {sortedGroups.length > 0 ? (
              <p className="px-1 text-[13px] font-semibold text-[var(--muted-foreground)]">
                {t('linksPage.ungrouped')}
              </p>
            ) : null}
            {ungroupedLinks.length > 0 ? (
              <Reorder.Group
                axis="y"
                as="ul"
                values={ungroupedLinks}
                onReorder={(next) => handleSectionReorder(null, next)}
                onPointerUp={() => void handleReorderPointerUp()}
                className="flex list-none flex-col gap-3 p-0 sm:gap-3.5"
              >
                {ungroupedLinks.map((link) => renderLinkCard(link))}
              </Reorder.Group>
            ) : sortedGroups.length > 0 ? (
              <p className="rounded-xl border border-dashed border-[var(--border)] px-3 py-4 text-center text-xs text-[var(--muted-foreground)]">
                {t('linksPage.allInGroups')}
              </p>
            ) : null}
          </div>
        </div>
      )}

      <AddLinkCatalogDialog
        open={catalogOpen}
        onClose={() => setCatalogOpen(false)}
        onSubmit={handleCreatePayload}
      />
      <AddLinkMobileDialog
        open={catalogOpen}
        onClose={() => setCatalogOpen(false)}
        onSubmit={handleCreatePayload}
      />
      <CreateLinkGroupDialog
        open={groupDialogOpen}
        busy={busyId === 'group-create'}
        onClose={() => setGroupDialogOpen(false)}
        onSubmit={handleCreateGroup}
      />
    </section>
  );
}
