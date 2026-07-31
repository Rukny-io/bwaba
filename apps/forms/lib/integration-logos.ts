/** Official integration logos shipped in `public/logo-rukny/`. */
function ruknyLogo(filename: string) {
  return `/logo-rukny/${encodeURIComponent(filename)}`;
}

export type IntegrationLogoAsset = {
  src: string;
  alt: string;
};

export const INTEGRATION_LOGOS = {
  googleSheets: {
    src: ruknyLogo('Google Sheets.svg'),
    alt: 'Google Sheets',
  },
  googleDrive: {
    src: ruknyLogo('Google Drive.svg'),
    alt: 'Google Drive',
  },
  gmail: {
    src: ruknyLogo('gmail.svg'),
    alt: 'Gmail',
  },
  n8n: {
    src: ruknyLogo('n8n.svg'),
    alt: 'n8n',
  },
  slack: {
    src: ruknyLogo('Slack.svg'),
    alt: 'Slack',
  },
  zapier: {
    src: ruknyLogo('Zapier.svg'),
    alt: 'Zapier',
  },
  make: {
    src: ruknyLogo('Make.svg'),
    alt: 'Make',
  },
  developers: {
    src: '/rukny-logo.svg',
    alt: 'Rukny Developers',
  },
} as const satisfies Record<string, IntegrationLogoAsset>;
