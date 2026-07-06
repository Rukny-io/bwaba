import type {
  BorderRadius,
  CardStyle,
  MaxWidth,
  Shadow,
  Spacing,
} from './types';

export const BORDER_RADIUS_OPTIONS: {
  value: BorderRadius;
  label: string;
  hint: string;
}[] = [
  { value: 'none', label: 'حاد', hint: '0' },
  { value: 'sm', label: 'خفيف', hint: '6px' },
  { value: 'md', label: 'متوسط', hint: '8px' },
  { value: 'lg', label: 'مستدير', hint: '12px' },
  { value: 'xl', label: 'ناعم', hint: '16px' },
  { value: '2xl', label: 'كبير', hint: '20px' },
];

export const CARD_STYLE_OPTIONS: {
  value: CardStyle;
  label: string;
}[] = [
  { value: 'elevated', label: 'ظل' },
  { value: 'outlined', label: 'إطار' },
  { value: 'flat', label: 'مسطح' },
];

export const SHADOW_OPTIONS: {
  value: Shadow;
  label: string;
}[] = [
  { value: 'none', label: 'بدون' },
  { value: 'sm', label: 'خفيف' },
  { value: 'md', label: 'متوسط' },
  { value: 'lg', label: 'واضح' },
];

export const SPACING_OPTIONS: {
  value: Spacing;
  label: string;
}[] = [
  { value: 'compact', label: 'مضغوط' },
  { value: 'normal', label: 'متوازن' },
  { value: 'relaxed', label: 'فسيح' },
];

export const MAX_WIDTH_OPTIONS: {
  value: MaxWidth;
  label: string;
}[] = [
  { value: 'md', label: 'ضيق' },
  { value: 'lg', label: 'متوسط' },
  { value: '2xl', label: 'عريض' },
  { value: '3xl', label: 'كامل' },
];

export function getBorderRadiusPreviewClass(radius: BorderRadius): string {
  switch (radius) {
    case 'none':
      return 'rounded-none';
    case 'sm':
      return 'rounded-sm';
    case 'md':
      return 'rounded-md';
    case 'lg':
      return 'rounded-lg';
    case 'xl':
      return 'rounded-xl';
    case '2xl':
      return 'rounded-2xl';
    case 'full':
      return 'rounded-full';
    default:
      return 'rounded-lg';
  }
}
