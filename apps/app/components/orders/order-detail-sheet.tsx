'use client';

import { useEffect, useRef } from 'react';
import { Drawer } from '@heroui/react';
import {
  OrderDetailContent,
  OrderDetailFooter,
} from '@/components/orders/order-detail-content';
import { useTranslations } from '@/lib/i18n';
import type { StoreOrder } from '@/lib/orders/types';
import { cn } from '@/lib/utils';

interface OrderDetailSheetProps {
  order: StoreOrder | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onPrevious?: () => void;
  onNext?: () => void;
  canGoPrevious?: boolean;
  canGoNext?: boolean;
}

export function OrderDetailSheet({
  order,
  isOpen,
  onOpenChange,
  onPrevious,
  onNext,
  canGoPrevious = false,
  canGoNext = false,
}: OrderDetailSheetProps) {
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const { t, locale, direction } = useTranslations();

  useEffect(() => {
    if (!order || !isOpen) return;
    const body = bodyRef.current;
    if (!body) return;
    body.scrollTop = 0;
  }, [order?.id, isOpen]);

  if (!order) return null;

  return (
    <Drawer.Backdrop
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      variant="blur"
      className="!bg-black/5 !backdrop-blur-[3px]"
    >
      <Drawer.Content placement={direction === 'rtl' ? 'left' : 'right'}>
        <Drawer.Dialog
          dir={direction}
          lang={locale}
          aria-label={t('orders.detailTitle')}
          className={cn(
            'relative flex !m-3 !h-[calc(100%-1.5rem)] !w-[26rem] !max-w-[calc(100vw-1.5rem)] flex-col !rounded-xl bg-[var(--surface)] !p-0',
            direction === 'rtl'
              ? 'in-data-[entering=true]:!-translate-x-[calc(100%+1.5rem)] in-data-[exiting=true]:!-translate-x-[calc(100%+1.5rem)]'
              : 'in-data-[entering=true]:!translate-x-[calc(100%+1.5rem)] in-data-[exiting=true]:!translate-x-[calc(100%+1.5rem)]',
          )}
        >
          <Drawer.Body
            ref={bodyRef}
            className="!m-0 min-h-0 flex-1 scrollbar-none px-5 pt-5 pb-6 [&::-webkit-scrollbar]:hidden"
          >
            <OrderDetailContent order={order} showFooter={false} />
          </Drawer.Body>
          <div className="px-3 pb-3">
            <OrderDetailFooter
              order={order}
              onClose={() => onOpenChange(false)}
              onPrevious={onPrevious}
              onNext={onNext}
              canGoPrevious={canGoPrevious}
              canGoNext={canGoNext}
            />
          </div>
        </Drawer.Dialog>
      </Drawer.Content>
    </Drawer.Backdrop>
  );
}
