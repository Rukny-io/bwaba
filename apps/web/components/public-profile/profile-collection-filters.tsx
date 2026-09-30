'use client';

import { useTranslations } from 'next-intl';
import { ProfileEntityPill } from '@/components/public-profile/profile-entity-pill';
import type { PublicProfileCollection } from './types';
import { cn } from './utils';

interface ProfileCollectionFiltersProps {
  collections: PublicProfileCollection[];
  value: string | null;
  onChange: (collectionId: string | null) => void;
  resolveMediaUrl: (path: string | null | undefined) => string | null;
  compact?: boolean;
}

export function ProfileCollectionFilters({
  collections,
  value,
  onChange,
  resolveMediaUrl,
}: ProfileCollectionFiltersProps) {
  const t = useTranslations('publicProfile.store');

  if (collections.length === 0) return null;

  const options = [
    {
      id: null as string | null,
      label: t('allCollections'),
      imageUrl: null as string | null,
    },
    ...collections.map((collection) => ({
      id: collection.id,
      label: collection.name,
      imageUrl:
        resolveMediaUrl(collection.imagePath) ??
        resolveMediaUrl(collection.bannerPath),
    })),
  ];

  return (
    <div
      className={cn(
        '-mx-1 flex gap-2 overflow-x-auto overscroll-x-contain py-1 ps-1 pe-2',
        '[-ms-overflow-style:none] [scrollbar-width:none] [scroll-padding-inline:8px] [&::-webkit-scrollbar]:hidden',
      )}
      role="tablist"
      aria-label={t('collectionsFilterLabel')}
    >
      {options.map((option) => {
        const isActive = value === option.id;

        return (
          <ProfileEntityPill
            key={option.id ?? 'all'}
            label={option.label}
            imageUrl={option.imageUrl ?? undefined}
            selected={isActive}
            onClick={() => onChange(option.id)}
            role="tab"
            aria-selected={isActive}
          />
        );
      })}
    </div>
  );
}
