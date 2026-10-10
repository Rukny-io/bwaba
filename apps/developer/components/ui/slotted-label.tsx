'use client';

import { Label as HeroUILabel } from '@heroui/react';
import type { ComponentProps } from 'react';

type SlottedLabelProps = ComponentProps<typeof HeroUILabel> & {
  isSelected?: boolean;
  isPressed?: boolean;
  isHovered?: boolean;
  isFocused?: boolean;
  isFocusVisible?: boolean;
  hasSubmenu?: boolean;
  selectionMode?: string;
};

/** Label safe inside MenuItem / Switch slots (strips selection render props). */
export function SlottedLabel({
  isSelected: _isSelected,
  isPressed: _isPressed,
  isHovered: _isHovered,
  isFocused: _isFocused,
  isFocusVisible: _isFocusVisible,
  hasSubmenu: _hasSubmenu,
  selectionMode: _selectionMode,
  ...props
}: SlottedLabelProps) {
  return <HeroUILabel {...props} />;
}
