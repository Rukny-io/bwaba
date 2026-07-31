'use client';

import { useEffect, useMemo, useState } from 'react';
import { Sparkles, X } from 'lucide-react';
import { Button, Modal } from '@heroui/react';
import { hqApi } from '@/lib/hq-api';
import type {
  SupportCannedResponse,
  SupportCannedResponseCategory,
} from '@/lib/types/support-tickets';
import { cn } from '@/lib/utils';

const CATEGORY_LABELS: Record<SupportCannedResponseCategory, { en: string; ar: string }> = {
  GREETING: { en: 'Greeting', ar: 'ترحيب' },
  INFO_REQUEST: { en: 'Info', ar: 'معلومات' },
  RESOLUTION: { en: 'Resolution', ar: 'حل' },
  BILLING: { en: 'Billing', ar: 'فوترة' },
  FOLLOW_UP: { en: 'Follow-up', ar: 'متابعة' },
  CLOSING: { en: 'Closing', ar: 'إغلاق' },
};

interface SupportCannedRepliesPickerProps {
  onSelect: (body: string) => void;
  disabled?: boolean;
}

export function SupportCannedRepliesPicker({
  onSelect,
  disabled,
}: SupportCannedRepliesPickerProps) {
  const [open, setOpen] = useState(false);
  const [responses, setResponses] = useState<SupportCannedResponse[]>([]);
  const [locale, setLocale] = useState<'en' | 'ar'>('ar');
  const [activeCategory, setActiveCategory] = useState<
    SupportCannedResponseCategory | 'ALL'
  >('ALL');

  useEffect(() => {
    if (!open) return;
    void hqApi.getSupportCannedResponses(locale).then((res) => {
      setResponses(res.responses);
    });
  }, [locale, open]);

  const categories = useMemo(() => {
    const unique = [...new Set(responses.map((item) => item.category))];
    return unique;
  }, [responses]);

  const filtered = useMemo(() => {
    if (activeCategory === 'ALL') return responses;
    return responses.filter((item) => item.category === activeCategory);
  }, [activeCategory, responses]);

  function handleSelect(body: string) {
    onSelect(body);
    setOpen(false);
  }

  return (
    <>
      <Button
        size="sm"
        variant="tertiary"
        className="h-10 rounded-xl"
        isDisabled={disabled}
        onPress={() => setOpen(true)}
      >
        <Sparkles className="size-3.5" />
        Quick replies
      </Button>

      <Modal>
        <Modal.Backdrop isOpen={open} onOpenChange={setOpen}>
          <Modal.Container placement="center">
            <Modal.Dialog className="flex max-h-[min(88vh,640px)] w-[min(100vw-2rem,28rem)] flex-col overflow-hidden sm:max-w-md">
              <Modal.CloseTrigger />

              <Modal.Header className="shrink-0 border-b border-[var(--border)]/40 pb-3">
                <div className="flex w-full items-start justify-between gap-3 pe-8">
                  <div>
                    <Modal.Heading className="text-base">Quick replies</Modal.Heading>
                    <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                      Choose a template to insert into your reply
                    </p>
                  </div>
                  <div className="flex shrink-0 rounded-full bg-[var(--surface-secondary)] p-0.5">
                    {(['ar', 'en'] as const).map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => {
                          setLocale(item);
                          setActiveCategory('ALL');
                        }}
                        className={cn(
                          'rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase transition-colors',
                          locale === item
                            ? 'bg-[var(--surface)] text-[var(--foreground)] shadow-sm'
                            : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]',
                        )}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              </Modal.Header>

              <div className="shrink-0 border-b border-[var(--border)]/40 px-4 py-2.5">
                <div className="flex flex-wrap gap-1">
                  <button
                    type="button"
                    onClick={() => setActiveCategory('ALL')}
                    className={cn(
                      'rounded-full px-2.5 py-1 text-[10px] font-medium transition-colors',
                      activeCategory === 'ALL'
                        ? 'bg-[var(--foreground)] text-[var(--background)]'
                        : 'bg-[var(--surface-secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]',
                    )}
                  >
                    {locale === 'ar' ? 'الكل' : 'All'}
                  </button>
                  {categories.map((category) => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => setActiveCategory(category)}
                      className={cn(
                        'rounded-full px-2.5 py-1 text-[10px] font-medium transition-colors',
                        activeCategory === category
                          ? 'bg-[var(--foreground)] text-[var(--background)]'
                          : 'bg-[var(--surface-secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]',
                      )}
                    >
                      {CATEGORY_LABELS[category][locale]}
                    </button>
                  ))}
                </div>
              </div>

              <Modal.Body className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
                <ul className="space-y-1">
                  {filtered.map((item) => (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => handleSelect(item.body)}
                        className="w-full rounded-xl px-3 py-2.5 text-start transition-colors hover:bg-[var(--surface-secondary)]"
                      >
                        <p className="text-sm font-medium text-[var(--foreground)]">
                          {item.title}
                        </p>
                        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[var(--muted-foreground)]">
                          {item.body}
                        </p>
                      </button>
                    </li>
                  ))}
                </ul>
              </Modal.Body>

              <Modal.Footer className="shrink-0 border-t border-[var(--border)]/40 pt-3">
                <Button
                  variant="tertiary"
                  className="w-full rounded-xl"
                  onPress={() => setOpen(false)}
                >
                  <X className="size-3.5" />
                  Close
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </>
  );
}
