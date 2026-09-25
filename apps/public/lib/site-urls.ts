const accountsBase =
  process.env.NEXT_PUBLIC_ACCOUNTS_URL || 'https://accounts.rukny.io';

const formsBase =
  process.env.NEXT_PUBLIC_FORMS_URL || 'https://forms.rukny.io';

const mailBase = process.env.NEXT_PUBLIC_MAIL_URL || 'https://mail.rukny.io';

const developersBase =
  process.env.NEXT_PUBLIC_DEVELOPERS_URL || 'http://localhost:3004';

export const siteUrls = {
  home: 'https://rukny.io',
  accounts: accountsBase,
  forms: formsBase,
  mail: mailBase,
  developers: developersBase,
  privacy: `${accountsBase}/privacy`,
  terms: `${accountsBase}/terms`,
  login: `${accountsBase}/login`,
  formsLogin: `${formsBase}/login`,
} as const;
