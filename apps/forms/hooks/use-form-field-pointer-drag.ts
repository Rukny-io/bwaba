'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export interface FieldDropTarget {
  sectionKey: string;
  index: number;
}

function clearDragChrome() {
  document.body.style.removeProperty('user-select');
  document.body.style.removeProperty('cursor');
}

function setDragChrome() {
  document.body.style.userSelect = 'none';
  document.body.style.cursor = 'grabbing';
}

export function resolveFieldDropTarget(
  x: number,
  y: number,
): FieldDropTarget | null {
  const el = document.elementFromPoint(x, y);
  if (!el) return null;

  const zone = el.closest('[data-field-drop]') as HTMLElement | null;
  if (zone?.dataset.sectionKey != null && zone.dataset.dropIndex != null) {
    return {
      sectionKey: zone.dataset.sectionKey,
      index: Number(zone.dataset.dropIndex),
    };
  }

  const card = el.closest('[data-field-card]') as HTMLElement | null;
  if (
    card?.dataset.sectionKey != null &&
    card.dataset.fieldIndex != null &&
    !card.dataset.dragging
  ) {
    const rect = card.getBoundingClientRect();
    const fieldIndex = Number(card.dataset.fieldIndex);
    const insertAfter = y > rect.top + rect.height / 2;
    return {
      sectionKey: card.dataset.sectionKey,
      index: insertAfter ? fieldIndex + 1 : fieldIndex,
    };
  }

  const section = el.closest('[data-section-drop]') as HTMLElement | null;
  if (section?.dataset.sectionKey != null) {
    return { sectionKey: section.dataset.sectionKey, index: 0 };
  }

  return null;
}

interface UseFormFieldPointerDragOptions {
  enabled: boolean;
  onDrop: (fieldId: string, target: FieldDropTarget) => void;
}

export function useFormFieldPointerDrag({
  enabled,
  onDrop,
}: UseFormFieldPointerDragOptions) {
  const [draggingFieldId, setDraggingFieldId] = useState('');
  const [dropTarget, setDropTarget] = useState<FieldDropTarget | null>(null);
  const draggingRef = useRef('');
  const dropRef = useRef<FieldDropTarget | null>(null);
  const onDropRef = useRef(onDrop);

  onDropRef.current = onDrop;
  dropRef.current = dropTarget;

  const cancelDrag = useCallback(() => {
    draggingRef.current = '';
    setDraggingFieldId('');
    setDropTarget(null);
    clearDragChrome();
  }, []);

  const handleGripPointerDown = useCallback(
    (fieldId: string, e: React.PointerEvent<HTMLElement>) => {
      if (!enabled || e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();
      e.currentTarget.setPointerCapture?.(e.pointerId);

      draggingRef.current = fieldId;
      setDraggingFieldId(fieldId);
      setDragChrome();

      const onMove = (ev: PointerEvent) => {
        const target = resolveFieldDropTarget(ev.clientX, ev.clientY);
        setDropTarget(target);
      };

      const onUp = (ev: PointerEvent) => {
        document.removeEventListener('pointermove', onMove);
        document.removeEventListener('pointerup', onUp);
        document.removeEventListener('pointercancel', onUp);

        const field = draggingRef.current;
        const target =
          resolveFieldDropTarget(ev.clientX, ev.clientY) ?? dropRef.current;

        draggingRef.current = '';
        setDraggingFieldId('');
        setDropTarget(null);
        clearDragChrome();

        if (field && target) {
          onDropRef.current(field, target);
        }
      };

      document.addEventListener('pointermove', onMove);
      document.addEventListener('pointerup', onUp);
      document.addEventListener('pointercancel', onUp);
    },
    [enabled],
  );

  useEffect(() => {
    if (!enabled) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && draggingRef.current) {
        cancelDrag();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [enabled, cancelDrag]);

  useEffect(() => () => clearDragChrome(), []);

  return {
    draggingFieldId,
    dropTarget,
    isDragging: Boolean(draggingFieldId),
    handleGripPointerDown,
    cancelDrag,
  };
}
