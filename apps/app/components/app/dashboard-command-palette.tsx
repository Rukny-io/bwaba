'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Description,
  Header,
  Kbd,
  Label,
  ListBox,
  Modal,
  SearchField,
  Separator,
} from '@heroui/react';
import { ChevronLeft } from 'lucide-react';
import { commandPaletteSections } from '@/components/app/nav-config';
import { useTranslations } from '@/lib/i18n';
import { cn } from '@/lib/utils';

const COMMAND_PALETTE_ICON = '/hero/search-square-svgrepo-com.svg';

function CommandPaletteIcon({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn('inline-block size-7 bg-current opacity-80 sm:size-8', className)}
      style={{
        maskImage: `url("${COMMAND_PALETTE_ICON}")`,
        WebkitMaskImage: `url("${COMMAND_PALETTE_ICON}")`,
        maskRepeat: 'no-repeat',
        WebkitMaskRepeat: 'no-repeat',
        maskPosition: 'center',
        WebkitMaskPosition: 'center',
        maskSize: 'contain',
        WebkitMaskSize: 'contain',
      }}
    />
  );
}

function useIsMac() {
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    setIsMac(/Mac|iPhone|iPad|iPod/i.test(navigator.userAgent));
  }, []);

  return isMac;
}

export function DashboardCommandPalette({
  variant = 'header',
}: {
  variant?: 'header' | 'sidebar';
}) {
  const router = useRouter();
  const isMac = useIsMac();
  const { t, locale, direction } = useTranslations();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');

  const toggle = useCallback(() => {
    setIsOpen((open) => !open);
  }, []);

  const handleOpenChange = useCallback((open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setQuery('');
    }
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        toggle();
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [toggle]);

  const filteredSections = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) {
      return commandPaletteSections;
    }

    return commandPaletteSections
      .map((section) => ({
        ...section,
        items: section.items.filter((item) => {
          const haystack = [
            item.label,
            item.labelEn,
            item.description,
            item.descriptionEn,
          ]
            .join(' ')
            .toLowerCase();
          return haystack.includes(trimmed);
        }),
      }))
      .filter((section) => section.items.length > 0);
  }, [query]);

  function handleAction(key: React.Key) {
    const href = String(key);
    router.push(href);
    handleOpenChange(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label={t('chrome.quickSearch')}
        title={t('chrome.quickSearch')}
        aria-keyshortcuts={isMac ? 'Meta+K' : 'Control+K'}
        className={cn(
          variant === 'sidebar'
            ? 'group relative flex size-10 items-center justify-center rounded-xl text-[var(--muted-foreground)] transition-colors duration-75 hover:bg-[var(--surface-secondary)] hover:text-[var(--foreground)]'
            : 'flex size-9 shrink-0 items-center justify-center rounded-lg sm:size-10',
          variant === 'header' &&
            'text-[var(--muted-foreground)] transition-colors duration-200 hover:bg-black/5 hover:text-[var(--foreground)] dark:hover:bg-white/10',
          'active:scale-[0.97]',
        )}
      >
        <CommandPaletteIcon />
      </button>

      <Modal.Backdrop
        isOpen={isOpen}
        onOpenChange={handleOpenChange}
        isDismissable
        variant="blur"
      >
        <Modal.Container
          placement="center"
          scroll="inside"
          className="px-2 sm:px-3"
        >
          <Modal.Dialog
            dir={direction}
            lang={locale}
            className="dashboard-command-palette !max-w-[min(calc(100vw-1rem),32rem)] flex w-full max-h-[calc(100dvh-2rem)] flex-col overflow-hidden rounded-xl p-0 shadow-xl ring-1 ring-black/6 dark:ring-white/8"
          >
            <div className="shrink-0 border-b border-[var(--border)]/50 px-4 py-3 sm:px-5">
              <SearchField
                fullWidth
                name="command-palette"
                value={query}
                onChange={setQuery}
                aria-label={t('chrome.searchPages')}
              >
                <SearchField.Group className="min-h-11 rounded-lg border-0 bg-[var(--surface-secondary)]/60 px-1 shadow-none ring-0">
                  <SearchField.SearchIcon className="size-[18px] text-[var(--muted-foreground)]" />
                  <SearchField.Input
                    autoFocus
                    placeholder={t('chrome.searchPlaceholder')}
                    className="h-11 text-start text-[15px]"
                  />
                  {query ? <SearchField.ClearButton /> : null}
                  <Kbd className="ms-2 hidden shrink-0 sm:flex" variant="light">
                    {isMac ? (
                      <Kbd.Abbr keyValue="command" />
                    ) : (
                      <Kbd.Abbr keyValue="ctrl" />
                    )}
                    <Kbd.Content>K</Kbd.Content>
                  </Kbd>
                </SearchField.Group>
              </SearchField>
            </div>

            <div className="max-h-[min(24rem,calc(100dvh-10rem))] overflow-y-auto overscroll-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden px-3 py-2.5 sm:px-4">
              {filteredSections.length > 0 ? (
                <ListBox
                  aria-label={t('chrome.searchResults')}
                  className="w-full p-0.5"
                  dir={direction}
                  selectionMode="none"
                  onAction={handleAction}
                >
                  {filteredSections.map((section, sectionIndex) => (
                    <ListBox.Section key={section.id}>
                      {sectionIndex > 0 ? (
                        <Separator className="my-2 bg-[var(--border)]/40" />
                      ) : null}
                      <Header className="px-2.5 pb-1.5 pt-0.5 text-start text-[12px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                        {locale === 'en' ? section.labelEn : section.label}
                      </Header>
                      {section.items.map((item) => {
                        const Icon = item.icon;
                        const label = locale === 'en' ? item.labelEn : item.label;
                        const description =
                          locale === 'en' ? item.descriptionEn : item.description;

                        return (
                          <ListBox.Item
                            key={item.href}
                            id={item.href}
                            textValue={`${label} ${description}`}
                            className="command-palette-item min-h-11 rounded-lg px-2.5 py-2.5"
                          >
                            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[var(--surface-secondary)] text-[var(--muted-foreground)]">
                              <Icon className="size-[18px]" strokeWidth={1.75} aria-hidden />
                            </div>
                            <div className="flex min-w-0 flex-1 flex-col gap-0.5 text-start">
                              <Label className="!w-full text-start text-[14px] font-medium leading-tight">
                                {label}
                              </Label>
                              <Description className="!w-full truncate text-start text-[12px] leading-tight text-[var(--muted-foreground)]">
                                {description}
                              </Description>
                            </div>
                            <ChevronLeft
                              className="command-palette-item-chevron size-4 shrink-0 text-[var(--muted-foreground)]/45 rtl:rotate-180"
                              strokeWidth={1.75}
                              aria-hidden
                            />
                          </ListBox.Item>
                        );
                      })}
                    </ListBox.Section>
                  ))}
                </ListBox>
              ) : (
                <p className="px-3 py-10 text-center text-sm text-[var(--muted-foreground)]">
                  {t('chrome.noSearchResults', { query })}
                </p>
              )}
            </div>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </>
  );
}
