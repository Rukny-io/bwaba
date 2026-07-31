import localFont from 'next/font/local';

/** Thmanyah Sans — primary UI typeface for Rukny apps (next/font/local). */
export const thmanyahSans = localFont({
  src: [
    {
      path: '../fonts/thmanyahsans/thmanyahsans-Light.woff2',
      weight: '300',
      style: 'normal',
    },
    {
      path: '../fonts/thmanyahsans/thmanyahsans-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../fonts/thmanyahsans/thmanyahsans-Medium.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../fonts/thmanyahsans/thmanyahsans-Bold.woff2',
      weight: '700',
      style: 'normal',
    },
    {
      path: '../fonts/thmanyahsans/thmanyahsans-Black.woff2',
      weight: '900',
      style: 'normal',
    },
  ],
  variable: '--font-thmanyah-sans',
  display: 'swap',
  fallback: ['system-ui', 'sans-serif'],
});
