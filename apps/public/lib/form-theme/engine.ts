import type { CSSProperties } from 'react';
import {
  DEFAULT_FORM_SUBMIT_LABEL,
  DEFAULT_FORM_THEME,
  DEFAULT_FORM_THEME_SIZING,
  type BorderRadius,
  type FormTheme,
  type FormThemeSizing,
  type MaxWidth,
  type Shadow,
  type Spacing,
} from './types';
import { normalizeHexColor } from './presets';

const BORDER_RADIUS: Record<BorderRadius, string> = {
  none: '0',
  sm: '0.375rem',
  md: '0.5rem',
  lg: '0.75rem',
  xl: '1rem',
  '2xl': '1.25rem',
  full: '9999px',
};

const MAX_WIDTH: Record<MaxWidth, string> = {
  sm: '24rem',
  md: '28rem',
  lg: '32rem',
  xl: '36rem',
  '2xl': '42rem',
  '3xl': '48rem',
  full: '100%',
};

const SPACING: Record<Spacing, string> = {
  compact: '0.5rem',
  normal: '1rem',
  relaxed: '1.5rem',
};

const SHADOW: Record<Shadow, string> = {
  none: 'none',
  sm: '0 1px 2px rgba(15, 23, 42, 0.05)',
  md: '0 4px 12px rgba(15, 23, 42, 0.08)',
  lg: '0 12px 40px rgba(15, 23, 42, 0.1)',
  xl: '0 20px 50px rgba(15, 23, 42, 0.12)',
  '2xl': '0 25px 60px rgba(15, 23, 42, 0.16)',
};

const GOOGLE_FONT_IDS: Record<string, string> = {
  Cairo: 'Cairo',
  Tajawal: 'Tajawal',
  Almarai: 'Almarai',
  'IBM Plex Sans Arabic': 'IBM+Plex+Sans+Arabic',
  'Readex Pro': 'Readex+Pro',
  'Noto Sans Arabic': 'Noto+Sans+Arabic',
};

const LOCAL_FONT_FAMILIES = new Set(['Thmanyah Sans']);

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function mergeDeep<T>(base: T, patch: unknown): T {
  if (!isObject(patch)) return base;
  const out = { ...base } as Record<string, unknown>;
  for (const key of Object.keys(patch)) {
    const next = patch[key];
    const current = out[key];
    if (isObject(next) && isObject(current)) {
      out[key] = mergeDeep(current, next);
    } else if (next !== undefined) {
      out[key] = next;
    }
  }
  return out as T;
}

export function parseFormTheme(raw: unknown): FormTheme {
  if (!raw || !isObject(raw)) {
    return structuredClone(DEFAULT_FORM_THEME);
  }
  return mergeDeep(structuredClone(DEFAULT_FORM_THEME), raw);
}

export function getFormSubmitLabel(theme: FormTheme): string {
  const label = theme.submitLabel?.trim();
  return label || DEFAULT_FORM_SUBMIT_LABEL;
}

export function applyPrimaryColor(theme: FormTheme, primary: string): FormTheme {
  return {
    ...theme,
    colors: {
      ...theme.colors,
      primary,
      button: {
        ...theme.colors.button,
        background: primary,
      },
      input: {
        ...theme.colors.input,
        focusBorder: primary,
      },
    },
  };
}

export function getGoogleFontStylesheetUrl(fontFamily: string): string {
  if (LOCAL_FONT_FAMILIES.has(fontFamily)) return '';
  const id = GOOGLE_FONT_IDS[fontFamily] ?? fontFamily.replace(/ /g, '+');
  return `https://fonts.googleapis.com/css2?family=${id}:wght@400;600;700&display=swap`;
}

export function getPageBackground(theme: FormTheme): string {
  if (
    theme.advanced?.backgroundType === 'gradient' &&
    theme.advanced.backgroundGradient
  ) {
    return theme.advanced.backgroundGradient;
  }
  return theme.colors.background;
}

export function getCardShadow(theme: FormTheme): string {
  if (theme.layout.cardStyle === 'flat') return 'none';
  return SHADOW[theme.layout.shadow] ?? SHADOW.lg;
}

export function resolveThemeSizing(theme: FormTheme): FormThemeSizing {
  return { ...DEFAULT_FORM_THEME_SIZING, ...theme.sizing };
}

const BORDER_RADIUS_KEYS = new Set<string>(Object.keys(BORDER_RADIUS));

/** Preset key (lg) or raw CSS length (8px, 9999px) */
export function resolveInputRadius(value: string): string {
  if (BORDER_RADIUS_KEYS.has(value)) {
    return BORDER_RADIUS[value as BorderRadius] ?? value;
  }
  return value.trim() || BORDER_RADIUS.lg;
}

/** يحوّل الرمادي الفاتح إلى أبيض نقي للمعاينة */
function resolveLightSurface(color: string): string {
  const normalized = normalizeHexColor(color).toLowerCase();
  const lightSurface = new Set([
    '#ffffff',
    '#fff',
    '#f8fafc',
    '#f1f5f9',
    '#f9fafb',
    '#fafafa',
  ]);
  return lightSurface.has(normalized) ? '#ffffff' : color;
}

/** أبيض نظيف للحقول — أسلوب Wayl/Typeform */
export function resolveInputBackground(theme: FormTheme): string {
  const bg = theme.colors.input.background?.trim();
  if (!bg) return '#ffffff';

  const lower = bg.toLowerCase();
  if (lower === 'transparent') return '#ffffff';

  const normalized = normalizeHexColor(bg).toLowerCase();
  const lightSurface = new Set([
    '#ffffff',
    '#fff',
    '#f8fafc',
    '#f1f5f9',
    '#f9fafb',
    '#fafafa',
  ]);

  if (lightSurface.has(normalized)) return '#ffffff';

  const card = theme.colors.card?.trim();
  if (card && normalized === normalizeHexColor(card).toLowerCase()) {
    return '#ffffff';
  }

  return bg;
}

export function themeToCssVariables(theme: FormTheme): CSSProperties {
  const radius = BORDER_RADIUS[theme.layout.borderRadius] ?? BORDER_RADIUS.lg;
  const maxWidth = MAX_WIDTH[theme.layout.maxWidth] ?? MAX_WIDTH['2xl'];
  const fieldGap = SPACING[theme.layout.spacing] ?? SPACING.normal;
  const font = theme.typography.fontFamily;
  const sizing = resolveThemeSizing(theme);
  const inputRadius = resolveInputRadius(sizing.inputRadius);

  return {
    '--form-bg': resolveLightSurface(theme.colors.background),
    '--form-card': resolveLightSurface(theme.colors.card),
    '--form-primary': theme.colors.primary,
    '--form-secondary': theme.colors.secondary,
    '--form-accent': theme.colors.accent,
    '--form-input-bg': resolveInputBackground(theme),
    '--form-input-border': theme.colors.input.border,
    '--form-input-focus': theme.colors.input.focusBorder,
    '--form-input-text': theme.colors.input.text,
    '--form-text-heading': theme.colors.text.heading,
    '--form-text-body': theme.colors.text.body,
    '--form-text-label': theme.colors.text.label,
    '--form-text-placeholder': theme.colors.text.placeholder,
    '--form-btn-bg': theme.colors.button.background,
    '--form-btn-text': theme.colors.button.text,
    '--form-btn-hover': theme.colors.button.hover,
    '--form-radius': radius,
    '--form-max-width': maxWidth,
    '--form-field-gap': fieldGap,
    '--form-font': `"${font}", system-ui, sans-serif`,
    '--form-base-font-size': sizing.baseFontSize,
    '--form-cover-height': sizing.coverHeight,
    '--form-input-max-width': sizing.inputMaxWidth,
    '--form-input-height': sizing.inputHeight,
    '--form-input-border-width': sizing.inputBorderWidth,
    '--form-input-padding-x': sizing.inputPaddingX,
    '--form-input-radius': inputRadius,
    '--form-input-shadow':
      '0 1px 2px color-mix(in srgb, var(--form-text-heading) 5%, transparent)',
    '--form-input-shadow-hover':
      '0 2px 8px color-mix(in srgb, var(--form-text-heading) 7%, transparent)',
    '--form-input-shadow-focus':
      '0 0 0 3px color-mix(in srgb, var(--form-input-focus) 16%, transparent)',
    '--form-btn-height': sizing.buttonHeight,
    '--form-btn-font-size': sizing.buttonFontSize,
    '--form-btn-padding-x': sizing.buttonPaddingX,
    '--form-btn-margin-top': sizing.buttonMarginTop,
    fontFamily: `"${font}", system-ui, sans-serif`,
  } as CSSProperties;
}

export function hasCustomTheme(raw: unknown): boolean {
  return raw != null && isObject(raw) && Object.keys(raw).length > 0;
}
