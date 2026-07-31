'use client';

import { useEffect, useState } from 'react';
import { Grid2X2, IdCard, Link2, Wand2 } from 'lucide-react';
import {
  Alert,
  Button,
  Card,
  Chip,
  InputGroup,
  Label,
  Separator,
  Spinner,
  Surface,
  TextField,
  cn,
} from '@heroui/react';
import { LinkPlatformIconBadge } from '@/components/app/links/platform-icons/link-platform-icon-badge';
import { startInstagramOAuth } from '@/lib/links/instagram-oauth';
import type { LinkCatalogTypeId } from '@/lib/links/link-type-catalog';
import type { LinkLayout, SocialLink, UpdateSocialLinkInput } from '@/lib/links/types';

interface LinkDetailsTabProps {
  link: SocialLink;
  catalogType: LinkCatalogTypeId;
  saving: boolean;
  onSave: (input: UpdateSocialLinkInput) => Promise<void>;
}

const SOCIAL_CARD_PLATFORMS = new Set([
  'tiktok',
  'x',
  'twitter',
  'youtube',
  'facebook',
  'linkedin',
  'snapchat',
  'telegram',
]);

type LayoutOption = {
  id: LinkLayout;
  title: string;
  description: string;
  icon: typeof Link2;
  needsOAuth: boolean;
};

const IG_LAYOUTS: LayoutOption[] = [
  {
    id: 'classic',
    title: 'رابط بسيط',
    description: 'زر يفتح حسابك على إنستغرام',
    icon: Link2,
    needsOAuth: false,
  },
  {
    id: 'profile_card',
    title: 'بطاقة تعريفية',
    description: 'بطاقة بجانب المنصات الأخرى في صفحتين',
    icon: IdCard,
    needsOAuth: true,
  },
  {
    id: 'media_grid',
    title: 'عرض محتوى',
    description: 'شبكة من أحدث منشوراتك',
    icon: Grid2X2,
    needsOAuth: true,
  },
];

const SOCIAL_LAYOUTS: LayoutOption[] = [
  {
    id: 'classic',
    title: 'رابط بسيط',
    description: 'زر بعرض كامل يفتح الحساب',
    icon: Link2,
    needsOAuth: false,
  },
  {
    id: 'profile_card',
    title: 'بطاقة تعريفية',
    description: 'بطاقة مضغوطة بجانب بطاقات أخرى (عمودين)',
    icon: IdCard,
    needsOAuth: false,
  },
];

export function LinkDetailsTab({
  link,
  catalogType,
  saving,
  onSave,
}: LinkDetailsTabProps) {
  const [title, setTitle] = useState(link.title ?? link.username ?? '');
  const [url, setUrl] = useState(link.url);
  const [error, setError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const isInstagram = catalogType === 'instagram';
  const isSocialCardPlatform = SOCIAL_CARD_PLATFORMS.has(catalogType);
  const layouts = isInstagram ? IG_LAYOUTS : isSocialCardPlatform ? SOCIAL_LAYOUTS : null;

  useEffect(() => {
    setTitle(link.title ?? link.username ?? '');
    setUrl(link.url);
  }, [link.id, link.title, link.username, link.url]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
      setError('أدخل رابطاً صالحاً');
      return;
    }
    try {
      new URL(trimmedUrl);
    } catch {
      setError('صيغة الرابط غير صحيحة');
      return;
    }
    try {
      await onSave({
        title: title.trim() || undefined,
        username: title.trim() || link.username || undefined,
        url: trimmedUrl,
        platform: link.platform,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر الحفظ');
    }
  }

  async function handleLayout(layout: LinkLayout) {
    setError(null);
    const meta = layouts?.find((l) => l.id === layout);
    if (isInstagram && meta?.needsOAuth && !link.connectionId) {
      setConnecting(true);
      try {
        await startInstagramOAuth(
          layout === 'media_grid' ? 'media_grid' : 'profile_card',
          { linkId: link.id },
        );
      } catch (err) {
        setConnecting(false);
        setError(err instanceof Error ? err.message : 'تعذر بدء ربط إنستغرام');
      }
      return;
    }
    try {
      await onSave({ layout });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر تحديث العرض');
    }
  }

  async function handleConnectIg() {
    setConnecting(true);
    setError(null);
    try {
      await startInstagramOAuth(
        link.layout === 'media_grid' ? 'media_grid' : 'profile_card',
        { linkId: link.id },
      );
    } catch (err) {
      setConnecting(false);
      setError(err instanceof Error ? err.message : 'تعذر بدء ربط إنستغرام');
    }
  }

  return (
    <div className="flex flex-col gap-5 sm:gap-6">
      {layouts ? (
        <section className="space-y-3">
          <Card variant="transparent" className="gap-1 p-0 shadow-none">
            <Card.Header className="gap-1">
              <Card.Title className="text-sm font-bold">نوع العرض</Card.Title>
              <Card.Description className="text-xs">
                اختر كيف يظهر هذا الرابط على صفحتك
              </Card.Description>
            </Card.Header>
          </Card>

          <div className="grid gap-2 sm:grid-cols-1">
            {layouts.map(({ id, title: layoutTitle, description, icon: Icon, needsOAuth }) => {
              const selected = (link.layout ?? 'classic') === id;
              const needsConnect = isInstagram && needsOAuth && !link.connectionId;

              return (
                <button
                  key={id}
                  type="button"
                  disabled={saving || connecting}
                  onClick={() => void handleLayout(id)}
                  className="w-full text-start disabled:opacity-60"
                >
                  <Card
                    variant={selected ? 'secondary' : 'default'}
                    className={cn(
                      'gap-0 p-3.5 transition-colors sm:p-4',
                      selected
                        ? 'border-accent/40 bg-accent-soft/30'
                        : 'hover:bg-surface-secondary/70',
                    )}
                  >
                    <Card.Content className="flex-row items-start gap-3">
                      <Surface
                        variant={selected ? 'tertiary' : 'default'}
                        className={cn(
                          'mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-2xl',
                          selected ? 'bg-accent text-accent-foreground' : 'text-muted ring-1 ring-border',
                        )}
                      >
                        <Icon className="size-4" aria-hidden />
                      </Surface>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Card.Title className="text-sm font-bold">{layoutTitle}</Card.Title>
                          {needsConnect ? (
                            <Chip size="sm" variant="soft">
                              يتطلب ربط
                            </Chip>
                          ) : null}
                        </div>
                        <Card.Description className="mt-1 text-xs leading-relaxed">
                          {description}
                        </Card.Description>
                      </div>
                      <span
                        className={cn(
                          'mt-1.5 flex size-4 shrink-0 items-center justify-center rounded-full border-2',
                          selected ? 'border-accent bg-accent' : 'border-border',
                        )}
                        aria-hidden
                      >
                        {selected ? (
                          <span className="size-1.5 rounded-full bg-accent-foreground" />
                        ) : null}
                      </span>
                    </Card.Content>
                  </Card>
                </button>
              );
            })}
          </div>

          {isInstagram && !link.connectionId ? (
            <Card variant="secondary" className="gap-0 p-3 sm:p-3.5">
              <Card.Content className="flex-row items-center gap-3">
                <LinkPlatformIconBadge type="instagram" size="sm" />
                <div className="min-w-0 flex-1">
                  <Card.Title className="text-sm font-bold leading-tight">
                    اربط حساب إنستغرام
                  </Card.Title>
                  <Card.Description className="mt-0.5 text-[11px] leading-snug">
                    مطلوب للبطاقة التعريفية وشبكة المحتوى
                  </Card.Description>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  isDisabled={connecting}
                  onPress={() => void handleConnectIg()}
                  className="shrink-0 rounded-full"
                >
                  {connecting ? <Spinner size="sm" color="current" /> : 'ربط'}
                </Button>
              </Card.Content>
            </Card>
          ) : null}
        </section>
      ) : null}

      <section className={cn(layouts && 'space-y-3.5')}>
        {layouts ? <Separator /> : null}

        <Card variant="transparent" className="gap-1 p-0 pt-5 shadow-none sm:pt-6">
          <Card.Header className="gap-1">
            <Card.Title className="text-sm font-bold">المعلومات</Card.Title>
            <Card.Description className="text-xs leading-relaxed">
              العنوان والرابط الظاهران للزوار
            </Card.Description>
          </Card.Header>
        </Card>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <TextField
            value={title}
            onChange={setTitle}
            name="title"
            className="flex flex-col gap-2"
          >
            <Label className="text-xs font-medium text-muted">العنوان</Label>
            <InputGroup fullWidth>
              <InputGroup.Input placeholder="مثال: حسابي على إنستغرام" />
              <InputGroup.Suffix>
                <Wand2 className="size-4 text-muted" aria-hidden />
              </InputGroup.Suffix>
            </InputGroup>
          </TextField>

          <TextField
            value={url}
            onChange={setUrl}
            name="url"
            className="flex flex-col gap-2"
          >
            <Label className="text-xs font-medium text-muted">الرابط</Label>
            <InputGroup fullWidth>
              <InputGroup.Input placeholder="https://…" type="url" dir="ltr" />
              <InputGroup.Suffix>
                <Link2 className="size-4 text-muted" aria-hidden />
              </InputGroup.Suffix>
            </InputGroup>
          </TextField>

          {error ? (
            <Alert status="danger">
              <Alert.Indicator />
              <Alert.Content>
                <Alert.Description>{error}</Alert.Description>
              </Alert.Content>
            </Alert>
          ) : null}

          <Button
            type="submit"
            fullWidth
            isDisabled={saving}
            className="rounded-full"
          >
            {saving ? <Spinner size="sm" color="current" /> : 'حفظ التغييرات'}
          </Button>
        </form>
      </section>
    </div>
  );
}
