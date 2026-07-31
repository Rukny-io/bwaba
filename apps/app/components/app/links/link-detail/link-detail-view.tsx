'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowRight,
  BarChart3,
  Copy,
  ExternalLink,
  MoreVertical,
  Pin,
  Sparkles,
  SquarePen,
  Trash2,
} from 'lucide-react';
import {
  Alert,
  Button,
  Card,
  Dropdown,
  Label,
  Spinner,
  Tabs,
} from '@heroui/react';
import { LinkDetailsTab } from '@/components/app/links/link-detail/link-details-tab';
import { LinkInsightsTab } from '@/components/app/links/link-detail/link-insights-tab';
import { LinkPowerupsTab } from '@/components/app/links/link-detail/link-powerups-tab';
import { LinkPlatformIconBadge } from '@/components/app/links/platform-icons/link-platform-icon-badge';
import { useProfilePreviewSync } from '@/components/app/links/profile-preview-provider';
import { ApiException } from '@/lib/api-client';
import { formatNumber } from '@/lib/dashboard-format';
import { deleteLink, fetchLink, fetchMyLinks, updateLink } from '@/lib/links/api';
import {
  getLinkDisplayLabel,
  resolveCatalogTypeFromPlatform,
} from '@/lib/links/resolve-platform';
import type { SocialLink, UpdateSocialLinkInput } from '@/lib/links/types';
import { fetchMyProfile } from '@/lib/profile/api';
import { getPublicProfileUrl } from '@/lib/profile/public-url';
import type { MyProfile } from '@/lib/profile/types';

type DetailTab = 'details' | 'powerups' | 'insights';

const TABS: Array<{
  id: DetailTab;
  label: string;
  icon: typeof SquarePen;
}> = [
  { id: 'details', label: 'التفاصيل', icon: SquarePen },
  { id: 'powerups', label: 'إضافات', icon: Sparkles },
  { id: 'insights', label: 'التحليلات', icon: BarChart3 },
];

interface LinkDetailViewProps {
  linkId: string;
}

export function LinkDetailView({ linkId }: LinkDetailViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [link, setLink] = useState<SocialLink | null>(null);
  const [allLinks, setAllLinks] = useState<SocialLink[]>([]);
  const [profile, setProfile] = useState<MyProfile | null>(null);
  const [tab, setTab] = useState<DetailTab>('details');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [one, mine, profileData] = await Promise.all([
        fetchLink(linkId),
        fetchMyLinks(),
        fetchMyProfile(),
      ]);
      const owned = mine.some((l) => l.id === linkId);
      if (!owned) {
        throw new ApiException(403, 'غير مصرح');
      }
      setLink(one);
      setAllLinks(mine);
      setProfile(profileData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر تحميل الرابط');
      setLink(null);
    } finally {
      setLoading(false);
    }
  }, [linkId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const igStatus = searchParams.get('instagram');
    if (!igStatus) return;

    if (igStatus === 'success') {
      setError(null);
      void load();
    } else if (igStatus === 'error') {
      const reason = searchParams.get('reason');
      setError(
        reason === 'server'
          ? 'تعذر ربط إنستغرام. تأكد أن الحساب احترافي وأعد المحاولة.'
          : `تعذر ربط إنستغرام${reason ? ` (${reason})` : ''}`,
      );
    }

    router.replace(`/app/links/${linkId}`, { scroll: false });
  }, [searchParams, router, linkId, load]);

  const previewLinks = allLinks.map((l) => (l.id === link?.id && link ? link : l));
  useProfilePreviewSync(profile, previewLinks);

  async function patchLink(input: UpdateSocialLinkInput) {
    if (!link) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await updateLink(link.id, input);
      setLink(updated);
      setAllLinks((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر الحفظ');
      throw err;
    } finally {
      setSaving(false);
    }
  }

  function handleMenuAction(key: React.Key) {
    if (key === 'copy') void handleShare();
    if (key === 'delete') void handleDelete();
  }

  async function handleDelete() {
    if (!link) return;
    if (!window.confirm(`حذف "${getLinkDisplayLabel(link)}"؟`)) return;
    setSaving(true);
    try {
      await deleteLink(link.id);
      router.replace('/app/links');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر الحذف');
      setSaving(false);
    }
  }

  async function handleShare() {
    const publicUrl = getPublicProfileUrl(profile?.username);
    const text = publicUrl ?? link?.url ?? '';
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setError('تعذر نسخ الرابط');
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[240px] items-center justify-center">
        <Spinner size="lg" color="accent" aria-label="جاري تحميل الرابط" />
      </div>
    );
  }

  if (!link) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <Alert status="default" className="max-w-sm">
          <Alert.Content>
            <Alert.Description>{error || 'الرابط غير موجود'}</Alert.Description>
          </Alert.Content>
        </Alert>
        <Button className="rounded-full" onPress={() => router.push('/app/links')}>
          العودة للروابط
        </Button>
      </div>
    );
  }

  const title = getLinkDisplayLabel(link);
  const catalogType = resolveCatalogTypeFromPlatform(link.platform);
  const publicUrl = getPublicProfileUrl(profile?.username);
  const hostLabel = (() => {
    try {
      return new URL(link.url).hostname.replace(/^www\./, '');
    } catch {
      return link.platform;
    }
  })();

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-4 sm:gap-5">
      <div className="flex items-center justify-between gap-2">
        <Link
          href="/app/links"
          className="inline-flex h-9 items-center gap-1.5 rounded-full px-2 text-sm font-medium text-[var(--muted-foreground)] transition-colors hover:bg-[var(--surface-secondary)] hover:text-[var(--foreground)] sm:h-10 sm:px-2.5"
        >
          <ArrowRight className="size-4" />
          الروابط
        </Link>

        <Dropdown>
          <Button
            isIconOnly
            variant="ghost"
            aria-label="إجراءات الرابط"
            className="rounded-full"
          >
            <MoreVertical className="size-4" />
          </Button>
          <Dropdown.Popover placement="bottom end">
            <Dropdown.Menu onAction={handleMenuAction}>
              <Dropdown.Item id="copy" textValue={copied ? 'تم النسخ' : 'نسخ رابط الصفحة'}>
                <Copy className="size-4 shrink-0 text-muted" aria-hidden />
                <Label>{copied ? 'تم النسخ' : 'نسخ رابط الصفحة'}</Label>
              </Dropdown.Item>
              {publicUrl ? (
                <Dropdown.Item
                  id="preview"
                  href={publicUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  textValue="فتح الصفحة العامة"
                >
                  <ExternalLink className="size-4 shrink-0 text-muted" aria-hidden />
                  <Label>فتح الصفحة العامة</Label>
                </Dropdown.Item>
              ) : null}
              <Dropdown.Item
                id="delete"
                variant="danger"
                isDisabled={saving}
                textValue="حذف الرابط"
              >
                <Trash2 className="size-4 shrink-0" aria-hidden />
                <Label>حذف الرابط</Label>
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown.Popover>
        </Dropdown>
      </div>

      <article className="flex items-center gap-3 rounded-[1.35rem] p-3.5 sm:gap-3.5 sm:rounded-4xl sm:p-4">
        {link.thumbnail ? (
          <div className="size-11 shrink-0 overflow-hidden rounded-2xl ring-1 ring-[var(--border)] sm:size-12">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={link.thumbnail} alt="" className="size-full object-cover" />
          </div>
        ) : (
          <LinkPlatformIconBadge type={catalogType} size="md" />
        )}

        <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
          <div className="flex min-w-0 items-center gap-1.5">
            <h1 className="truncate text-[15px] font-bold leading-none text-[var(--foreground)] sm:text-base">
              {title}
            </h1>
            {link.isPinned ? (
              <Pin className="size-3.5 shrink-0 fill-[var(--primary)] text-[var(--primary)]" />
            ) : null}
          </div>
          <div className="flex min-w-0 items-center gap-1.5">
            <p
              className="truncate text-[12px] leading-none text-[var(--muted-foreground)]"
              dir="ltr"
            >
              {hostLabel}
            </p>
            
          </div>
        </div>

        <div className="flex h-11 shrink-0 flex-col items-center justify-center gap-0.5 rounded-2xl bg-[var(--surface-secondary)] px-3 sm:h-12 sm:min-w-[3.5rem]">
          <span
            className="text-[15px] font-bold tabular-nums leading-none text-[var(--foreground)]"
            dir="ltr"
            lang="en"
          >
            {formatNumber(link.totalClicks)}
          </span>
          <span className="text-[10px] font-medium leading-none text-[var(--muted-foreground)]">
            نقرة
          </span>
        </div>
      </article>

      <Tabs
        selectedKey={tab}
        onSelectionChange={(key) => setTab(key as DetailTab)}
        className="gap-4 sm:gap-5"
      >
        <Tabs.ListContainer className="flex justify-center">
          <Tabs.List aria-label="أقسام الرابط" className="h-auto w-auto flex-wrap justify-center gap-1 bg-transparent p-0">
            {TABS.map(({ id, label, icon: Icon }) => (
              <Tabs.Tab key={id} id={id} className="gap-1.5 px-3.5 py-2.5 text-xs font-bold sm:px-5 sm:text-[13px]">
                <Icon className="size-3.5 shrink-0" strokeWidth={2} aria-hidden />
                {label}
                <Tabs.Indicator />
              </Tabs.Tab>
            ))}
          </Tabs.List>
        </Tabs.ListContainer>

        {error ? (
          <Alert status="danger">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Description>{error}</Alert.Description>
            </Alert.Content>
          </Alert>
        ) : null}

        <Tabs.Panel id="details" className="min-w-0 p-0">
          {tab === 'details' ? (
            <Card variant="transparent" className="gap-0 p-3.5 shadow-none sm:p-5">
              <LinkDetailsTab
                link={link}
                catalogType={catalogType}
                saving={saving}
                onSave={patchLink}
              />
            </Card>
          ) : null}
        </Tabs.Panel>

        <Tabs.Panel id="powerups" className="min-w-0 p-0">
          {tab === 'powerups' ? (
            <Card variant="transparent" className="gap-0 p-3.5 shadow-none sm:p-5">
              <LinkPowerupsTab
                link={link}
                saving={saving}
                onTogglePin={() =>
                  void patchLink({ isPinned: !link.isPinned }).catch(() => undefined)
                }
                onToggleHide={() =>
                  void patchLink({
                    status: link.status === 'active' ? 'hidden' : 'active',
                  }).catch(() => undefined)
                }
              />
            </Card>
          ) : null}
        </Tabs.Panel>

        <Tabs.Panel id="insights" className="min-w-0 p-0">
          {tab === 'insights' ? (
            <Card variant="transparent" className="gap-0 p-3.5 shadow-none sm:p-5">
              <LinkInsightsTab linkId={link.id} link={link} />
            </Card>
          ) : null}
        </Tabs.Panel>
      </Tabs>
    </div>
  );
}
