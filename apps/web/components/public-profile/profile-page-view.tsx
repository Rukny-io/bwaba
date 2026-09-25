'use client';

import { useState, type ReactNode } from 'react';
import { FileText, Home, Link2 } from 'lucide-react';
import { MediaUrlProvider } from './media-url-context';
import { getProfileThemeClass } from './profile-themes';
import type { MediaUrlResolver, PublicProfile, PublicProfileForm, PublicSocialLink } from './types';
import { cn } from './utils';
import { ProfileFormsSection } from './profile-forms-section';
import { ProfileHeader } from './profile-header';
import { ProfileLinkButton } from './profile-link-button';
import { InstagramRichLink } from './instagram-rich-link';
import { SocialProfileCard } from './social-profile-card';

function isFormLink(platform: string): boolean {
  return platform === 'form';
}

function isProfileCard(link: PublicSocialLink): boolean {
  return link.layout === 'profile_card';
}

function isInstagramMediaGrid(link: PublicSocialLink): boolean {
  return link.platform === 'instagram' && link.layout === 'media_grid';
}

/** Home showcase: profile cards + Instagram posts grid */
function isHomeShowcaseLink(link: PublicSocialLink): boolean {
  return isProfileCard(link) || isInstagramMediaGrid(link);
}

type ProfileTab = 'home' | 'links' | 'forms';

type LinkRow =
  | { type: 'cards'; links: PublicSocialLink[] }
  | { type: 'single'; link: PublicSocialLink };

function groupProfileCards(links: PublicSocialLink[]): LinkRow[] {
  const rows: LinkRow[] = [];
  let cardBuffer: PublicSocialLink[] = [];

  const flushCards = () => {
    if (cardBuffer.length === 0) return;
    rows.push({ type: 'cards', links: cardBuffer });
    cardBuffer = [];
  };

  for (const link of links) {
    if (isProfileCard(link)) {
      cardBuffer.push(link);
      continue;
    }
    flushCards();
    rows.push({ type: 'single', link });
  }
  flushCards();

  return rows;
}

function renderLinkItem(
  link: PublicSocialLink,
  opts: {
    preview?: boolean;
    onTrackClick?: (linkId: string) => void;
  },
): ReactNode {
  if (isInstagramMediaGrid(link)) {
    return (
      <InstagramRichLink
        key={link.id}
        linkId={link.id}
        layout="media_grid"
        preview={opts.preview}
      />
    );
  }

  if (isProfileCard(link)) {
    if (link.platform === 'instagram') {
      return (
        <InstagramRichLink
          key={link.id}
          linkId={link.id}
          layout="profile_card"
          preview={opts.preview}
        />
      );
    }
    return (
      <SocialProfileCard
        key={link.id}
        link={link}
        preview={opts.preview}
        onTrackClick={opts.onTrackClick}
      />
    );
  }

  return (
    <ProfileLinkButton
      key={link.id}
      link={link}
      preview={opts.preview}
      onTrackClick={opts.onTrackClick}
    />
  );
}

function pickFeaturedForms(
  forms: PublicProfileForm[],
  featured: PublicProfileForm | null | undefined,
  limit = 4,
): PublicProfileForm[] {
  if (forms.length === 0) return [];
  const ordered: PublicProfileForm[] = [];
  const seen = new Set<string>();

  if (featured) {
    ordered.push(featured);
    seen.add(featured.id);
  }

  for (const form of forms) {
    if (seen.has(form.id)) continue;
    if (form.coverImage) {
      ordered.push(form);
      seen.add(form.id);
    }
    if (ordered.length >= limit) return ordered;
  }

  for (const form of forms) {
    if (seen.has(form.id)) continue;
    ordered.push(form);
    seen.add(form.id);
    if (ordered.length >= limit) break;
  }

  return ordered;
}

function EmptyTab({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="px-4 py-12 text-center">
      <p className="text-sm font-semibold text-[var(--foreground)]">{title}</p>
      <p className="mt-1 text-xs text-[var(--muted-foreground)]">{hint}</p>
    </div>
  );
}

export interface ProfilePageViewProps {
  profile: PublicProfile;
  forms?: PublicProfileForm[];
  featuredForm?: PublicProfileForm | null;
  preview?: boolean;
  /** @deprecated Prefer `constrained` for phone preview */
  embedded?: boolean;
  constrained?: boolean;
  fillHeight?: boolean;
  resolveMediaUrl?: MediaUrlResolver;
  onTrackClick?: (linkId: string) => void;
}

export function ProfilePageView({
  profile,
  forms = [],
  featuredForm = null,
  preview = false,
  embedded = false,
  constrained = false,
  fillHeight = false,
  resolveMediaUrl = (path) => path ?? null,
  onTrackClick,
}: ProfilePageViewProps) {
  const themeClass = getProfileThemeClass(profile.themeKey);
  const usePublicLayout = !embedded || constrained;
  const links = [...profile.socialLinks].sort((a, b) => a.displayOrder - b.displayOrder);

  const homeLinks = links.filter(isHomeShowcaseLink);
  const listLinks = links.filter(
    (l) => !isHomeShowcaseLink(l) && !isFormLink(l.platform),
  );
  const homeCardRows = groupProfileCards(homeLinks.filter(isProfileCard));
  const homeMediaGrids = homeLinks.filter(isInstagramMediaGrid);
  const featuredForms = pickFeaturedForms(forms, featuredForm, 4);

  const hasHome =
    homeCardRows.length > 0 || homeMediaGrids.length > 0 || featuredForms.length > 0;
  const hasLinks = listLinks.length > 0;
  const hasForms = forms.length > 0;
  const isEmpty = !hasHome && !hasLinks && !hasForms;

  const defaultTab: ProfileTab = hasHome ? 'home' : hasLinks ? 'links' : 'forms';
  const [tab, setTab] = useState<ProfileTab>(defaultTab);
  const showTabs = !isEmpty;

  const tabs: Array<{ id: ProfileTab; label: string; icon: typeof Home }> = [
    { id: 'home', label: 'الرئيسية', icon: Home },
    { id: 'links', label: 'الروابط', icon: Link2 },
    { id: 'forms', label: 'النماذج', icon: FileText },
  ];

  return (
    <MediaUrlProvider resolve={resolveMediaUrl}>
      <div
        className={cn(
          'profile-theme-scope text-[var(--foreground)]',
          themeClass,
          'bg-[var(--background)]',
          usePublicLayout && 'profile-page-public',
          embedded || constrained
            ? fillHeight
              ? 'min-h-full'
              : 'min-h-0'
            : 'min-h-screen',
        )}
      >
        <div
          className={cn(
            'relative z-[1] mx-auto w-full',
            usePublicLayout ? 'max-w-md px-4 pb-12' : 'max-w-md px-3 pb-8',
          )}
        >
          <ProfileHeader profile={profile} compact={embedded && !constrained} />

          {showTabs ? (
            <nav
              className="mt-6 flex items-center justify-center gap-2"
              aria-label="أقسام الصفحة"
            >
              {tabs.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTab(id)}
                  className={cn(
                    'profile-tab-pill',
                    tab === id ? 'profile-tab-pill-active' : 'profile-tab-pill-idle',
                  )}
                >
                  <Icon className="size-3.5" />
                  {label}
                </button>
              ))}
            </nav>
          ) : null}

          <div className={cn('space-y-3', showTabs ? 'mt-4' : 'mt-6')}>
            {showTabs && tab === 'home' ? (
              hasHome ? (
                <div className="space-y-3" aria-label="الرئيسية">
                  {homeCardRows.length > 0 ? (
                    <section className="space-y-2" aria-label="البطاقات التعريفية">
                      {homeCardRows.map((row) =>
                        row.type === 'cards' ? (
                          <div
                            key={`cards-${row.links.map((l) => l.id).join('-')}`}
                            className="grid grid-cols-2 gap-2"
                          >
                            {row.links.map((link) =>
                              renderLinkItem(link, { preview, onTrackClick }),
                            )}
                          </div>
                        ) : (
                          <div key={row.link.id}>
                            {renderLinkItem(row.link, { preview, onTrackClick })}
                          </div>
                        ),
                      )}
                    </section>
                  ) : null}

                  {homeMediaGrids.length > 0 ? (
                    <section className="space-y-2" aria-label="منشورات إنستغرام">
                      {homeMediaGrids.map((link) =>
                        renderLinkItem(link, { preview, onTrackClick }),
                      )}
                    </section>
                  ) : null}

                  {featuredForms.length > 0 ? (
                    <ProfileFormsSection
                      forms={featuredForms}
                      preview={preview}
                      showHeading
                      heading="نماذج مميزة"
                    />
                  ) : null}
                </div>
              ) : (
                <EmptyTab
                  title="لا يوجد محتوى بعد"
                  hint="أضف بطاقة تعريف أو نموذجاً للصفحة الرئيسية"
                />
              )
            ) : null}

            {showTabs && tab === 'links' ? (
              hasLinks ? (
                <section className="space-y-2" aria-label="الروابط">
                  {listLinks.map((link) => (
                    <div key={link.id}>{renderLinkItem(link, { preview, onTrackClick })}</div>
                  ))}
                </section>
              ) : (
                <EmptyTab title="لا توجد روابط" hint="أضف روابطك من لوحة التحكم" />
              )
            ) : null}

            {showTabs && tab === 'forms' ? (
              hasForms ? (
                <ProfileFormsSection forms={forms} preview={preview} />
              ) : (
                <EmptyTab title="لا توجد نماذج" hint="انشر نموذجاً ليظهر هنا" />
              )
            ) : null}

            {isEmpty ? (
              <div className="px-4 py-14 text-center">
                <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-[var(--surface-secondary)] text-[var(--muted-foreground)]">
                  <Link2 className="size-5" />
                </div>
                <p className="text-sm font-semibold text-[var(--foreground)]">لا توجد روابط بعد</p>
                <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                  ستظهر روابطك ونماذجك هنا
                </p>
              </div>
            ) : null}
          </div>

          {usePublicLayout && !preview && !constrained ? (
            <footer className="mt-12 text-center">
              <a
                href="/"
                className="inline-flex items-center gap-1.5 rounded-full bg-[var(--surface-secondary)] px-4 py-2 text-[11px] font-semibold text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
              >
                أنشئ صفحتك على ركني
              </a>
            </footer>
          ) : null}
        </div>
      </div>
    </MediaUrlProvider>
  );
}
