const accountsBase =
  process.env.NEXT_PUBLIC_ACCOUNTS_URL || 'https://accounts.rukny.io';

const formsBase =
  process.env.NEXT_PUBLIC_FORMS_URL || 'https://forms.rukny.io';

const mailBase = process.env.NEXT_PUBLIC_MAIL_URL || 'https://mail.rukny.io';

export const siteUrls = {
  home: 'https://rukny.io',
  accounts: accountsBase,
  forms: formsBase,
  mail: mailBase,
  privacy: `${accountsBase}/privacy`,
  terms: `${accountsBase}/terms`,
  login: `${accountsBase}/login`,
  formsLogin: `${formsBase}/login`,
} as const;
