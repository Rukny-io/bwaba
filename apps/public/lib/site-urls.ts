const accountsBase =
  process.env.NEXT_PUBLIC_ACCOUNTS_URL || 'https://accounts.rukny.io';

const formsBase =
  process.env.NEXT_PUBLIC_FORMS_URL || 'https://forms.rukny.io';

const appBase = process.env.NEXT_PUBLIC_APP_URL || 'https://app.rukny.io';

export const siteUrls = {
  home: 'https://rukny.io',
  accounts: accountsBase,
  forms: formsBase,
  app: appBase,
  privacy: '/privacy',
  terms: '/terms',
  login: `${accountsBase}/login`,
  formsLogin: `${formsBase}/login`,
} as const;
