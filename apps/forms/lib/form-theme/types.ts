export interface FormThemeColors {
  background: string;
  card: string;
  primary: string;
  secondary: string;
  accent: string;
  input: {
    background: string;
    border: string;
    focusBorder: string;
    text: string;
  };
  text: {
    heading: string;
    body: string;
    label: string;
    placeholder: string;
  };
  button: {
    background: string;
    text: string;
    hover: string;
  };
}

export interface FormThemeTypography {
  fontFamily: string;
  sizes: {
    heading: string;
    body: string;
    label: string;
  };
  weights: {
    heading: string;
    body: string;
  };
}

export type CardStyle = 'elevated' | 'flat' | 'outlined';
export type BorderRadius = 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
export type Shadow = 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
export type Spacing = 'compact' | 'normal' | 'relaxed';
export type MaxWidth = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full';
export type BackgroundType = 'solid' | 'gradient' | 'image';

export interface FormThemeLayout {
  cardStyle: CardStyle;
  borderRadius: BorderRadius;
  shadow: Shadow;
  spacing: Spacing;
  maxWidth: MaxWidth;
}

/** Granular sizing for public form (Tally-style controls) */
export interface FormThemeSizing {
  baseFontSize: string;
  coverHeight: string;
  inputMaxWidth: string;
  inputHeight: string;
  inputBorderWidth: string;
  inputPaddingX: string;
  inputRadius: string;
  buttonHeight: string;
  buttonFontSize: string;
  buttonPaddingX: string;
  buttonMarginTop: string;
}

export const DEFAULT_FORM_THEME_SIZING: FormThemeSizing = {
  baseFontSize: '16px',
  coverHeight: '200px',
  inputMaxWidth: '100%',
  inputHeight: '40px',
  inputBorderWidth: '1px',
  inputPaddingX: '12px',
  inputRadius: '12px',
  buttonHeight: '44px',
  buttonFontSize: '15px',
  buttonPaddingX: '24px',
  buttonMarginTop: '12px',
};

export interface FormThemeAdvanced {
  backgroundType: BackgroundType;
  backgroundGradient?: string;
  backgroundImage?: string;
  backgroundBlur?: number;
  darkMode: boolean;
  animations: boolean;
  customCSS?: string;
}

export type FormThemeTemplate = 'minimal' | 'corporate' | 'creative' | 'dark';

export const DEFAULT_FORM_SUBMIT_LABEL = 'إرسال';

export interface FormTheme {
  templateId?: FormThemeTemplate;
  coverImage?: string;
  logo?: string;
  favicon?: string;
  /** Custom label for the public submit button */
  submitLabel?: string;
  colors: FormThemeColors;
  typography: FormThemeTypography;
  layout: FormThemeLayout;
  sizing?: Partial<FormThemeSizing>;
  advanced?: FormThemeAdvanced;
}

export const DEFAULT_FORM_THEME: FormTheme = {
  colors: {
    background: '#ffffff',
    card: '#ffffff',
    primary: '#062C30',
    secondary: '#0a4854',
    accent: '#3b82f6',
    input: {
      background: '#ffffff',
      border: '#e8ecf0',
      focusBorder: '#062C30',
      text: '#1e293b',
    },
    text: {
      heading: '#0f172a',
      body: '#475569',
      label: '#64748b',
      placeholder: '#94a3b8',
    },
    button: {
      background: '#062C30',
      text: '#ffffff',
      hover: '#0a4854',
    },
  },
  typography: {
    fontFamily: 'Thmanyah Sans',
    sizes: { heading: '2xl', body: 'base', label: 'sm' },
    weights: { heading: 'bold', body: 'normal' },
  },
  layout: {
    cardStyle: 'elevated',
    borderRadius: 'lg',
    shadow: 'lg',
    spacing: 'relaxed',
    maxWidth: '2xl',
  },
  sizing: { ...DEFAULT_FORM_THEME_SIZING },
  advanced: {
    backgroundType: 'solid',
    darkMode: false,
    animations: true,
  },
};

export const ARABIC_FONTS = [
  { value: 'Thmanyah Sans', label: 'ثمانية — Thmanyah' },
  { value: 'Cairo', label: 'Cairo — القاهرة' },
  { value: 'Tajawal', label: 'Tajawal — تجوال' },
  { value: 'Almarai', label: 'Almarai — المرعي' },
  { value: 'IBM Plex Sans Arabic', label: 'IBM Plex — آي بي إم' },
  { value: 'Readex Pro', label: 'Readex Pro — ريدكس' },
  { value: 'Noto Sans Arabic', label: 'Noto Sans — نوتو' },
] as const;

export const FORM_THEME_TEMPLATES = {
  minimal: {
    name: 'بسيط',
    description: 'تصميم نظيف وبسيط',
    preview: { bg: '#ffffff', primary: '#000000', accent: '#64748b' },
    theme: {
      ...DEFAULT_FORM_THEME,
      templateId: 'minimal' as const,
      colors: {
        ...DEFAULT_FORM_THEME.colors,
        background: '#ffffff',
        card: '#ffffff',
        primary: '#0f172a',
        secondary: '#334155',
        button: {
          background: '#0f172a',
          text: '#ffffff',
          hover: '#334155',
        },
        input: {
          ...DEFAULT_FORM_THEME.colors.input,
          focusBorder: '#0f172a',
        },
      },
      layout: {
        ...DEFAULT_FORM_THEME.layout,
        cardStyle: 'flat' as CardStyle,
        shadow: 'none' as Shadow,
      },
    },
  },
  corporate: {
    name: 'احترافي',
    description: 'مناسب للشركات',
    preview: { bg: '#f1f5f9', primary: '#1e40af', accent: '#3b82f6' },
    theme: {
      ...DEFAULT_FORM_THEME,
      templateId: 'corporate' as const,
      colors: {
        ...DEFAULT_FORM_THEME.colors,
        background: '#f1f5f9',
        primary: '#1e40af',
        secondary: '#3b82f6',
        accent: '#3b82f6',
        button: {
          background: '#1e40af',
          text: '#ffffff',
          hover: '#1d4ed8',
        },
        input: {
          ...DEFAULT_FORM_THEME.colors.input,
          focusBorder: '#1e40af',
        },
      },
    },
  },
  creative: {
    name: 'إبداعي',
    description: 'ألوان جريئة ومتميزة',
    preview: { bg: '#fef3c7', primary: '#f59e0b', accent: '#8b5cf6' },
    theme: {
      ...DEFAULT_FORM_THEME,
      templateId: 'creative' as const,
      colors: {
        ...DEFAULT_FORM_THEME.colors,
        background: '#fef3c7',
        card: '#ffffff',
        primary: '#f59e0b',
        secondary: '#ef4444',
        accent: '#8b5cf6',
        button: {
          background: '#f59e0b',
          text: '#ffffff',
          hover: '#d97706',
        },
        input: {
          ...DEFAULT_FORM_THEME.colors.input,
          focusBorder: '#f59e0b',
        },
      },
      advanced: {
        ...DEFAULT_FORM_THEME.advanced!,
        backgroundType: 'gradient' as BackgroundType,
        backgroundGradient:
          'linear-gradient(135deg, #fef3c7 0%, #fce7f3 100%)',
      },
    },
  },
  dark: {
    name: 'داكن',
    description: 'وضع ليلي أنيق',
    preview: { bg: '#0f172a', primary: '#3b82f6', accent: '#818cf8' },
    theme: {
      ...DEFAULT_FORM_THEME,
      templateId: 'dark' as const,
      colors: {
        background: '#0f172a',
        card: '#1e293b',
        primary: '#3b82f6',
        secondary: '#60a5fa',
        accent: '#818cf8',
        input: {
          background: '#334155',
          border: '#475569',
          focusBorder: '#3b82f6',
          text: '#f1f5f9',
        },
        text: {
          heading: '#f8fafc',
          body: '#cbd5e1',
          label: '#94a3b8',
          placeholder: '#64748b',
        },
        button: {
          background: '#3b82f6',
          text: '#ffffff',
          hover: '#2563eb',
        },
      },
      advanced: {
        ...DEFAULT_FORM_THEME.advanced!,
        darkMode: true,
      },
    },
  },
} as const;
