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

export function DashboardCommandPalette() {
  const router = useRouter();
  const isMac = useIsMac();
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
        items: section.items.filter(
          (item) =>
            item.label.toLowerCase().includes(trimmed) ||
            item.description.toLowerCase().includes(trimmed),
        ),
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
        aria-label="بحث سريع"
        aria-keyshortcuts={isMac ? 'Meta+K' : 'Control+K'}
        className={cn(
          'flex size-9 shrink-0 items-center justify-center rounded-lg sm:size-10',
          'text-[var(--muted-foreground)] transition-colors duration-200',
          'hover:bg-black/5 hover:text-[var(--foreground)] dark:hover:bg-white/10',
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
            dir="rtl"
            lang="ar"
            className="dashboard-command-palette !max-w-[min(calc(100vw-1rem),32rem)] flex w-full max-h-[calc(100dvh-2rem)] flex-col overflow-hidden rounded-2xl p-0 shadow-xl ring-1 ring-black/6 dark:ring-white/8"
          >
            <div className="shrink-0 border-b border-[var(--border)]/50 px-4 py-3 sm:px-5">
              <SearchField
                fullWidth
                name="command-palette"
                value={query}
                onChange={setQuery}
                aria-label="بحث في الصفحات"
              >
                <SearchField.Group className="min-h-11 rounded-xl border-0 bg-[var(--surface-secondary)]/60 px-1 shadow-none ring-0">
                  <SearchField.SearchIcon className="size-[18px] text-[var(--muted-foreground)]" />
                  <SearchField.Input
                    autoFocus
                    placeholder="ابحث في الصفحات والسجلات..."
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
                  aria-label="نتائج البحث"
                  className="w-full p-0.5"
                  dir="rtl"
                  selectionMode="none"
                  onAction={handleAction}
                >
                  {filteredSections.map((section, sectionIndex) => (
                    <ListBox.Section key={section.id}>
                      {sectionIndex > 0 ? (
                        <Separator className="my-2 bg-[var(--border)]/40" />
                      ) : null}
                      <Header className="px-2.5 pb-1.5 pt-0.5 text-start text-[12px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                        {section.label}
                      </Header>
                      {section.items.map((item) => {
                        const Icon = item.icon;

                        return (
                          <ListBox.Item
                            key={item.href}
                            id={item.href}
                            textValue={`${item.label} ${item.description}`}
                            className="command-palette-item min-h-11 rounded-xl px-2.5 py-2.5"
                          >
                            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[var(--surface-secondary)] text-[var(--muted-foreground)]">
                              <Icon className="size-[18px]" strokeWidth={1.75} aria-hidden />
                            </div>
                            <div className="flex min-w-0 flex-1 flex-col gap-0.5 text-start">
                              <Label className="!w-full text-start text-[14px] font-medium leading-tight">
                                {item.label}
                              </Label>
                              <Description className="!w-full truncate text-start text-[12px] leading-tight text-[var(--muted-foreground)]">
                                {item.description}
                              </Description>
                            </div>
                            <ChevronLeft
                              className="command-palette-item-chevron size-4 shrink-0 text-[var(--muted-foreground)]/45"
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
                  لا توجد نتائج لـ &ldquo;{query}&rdquo;
                </p>
              )}
            </div>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </>
  );
}
