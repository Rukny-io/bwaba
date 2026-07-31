const SUBPATHS = [
  'types',
  'profile-themes',
  'platform-icon-assets',
  'map-profile-data',
  'media-url-context',
  'resolve-media-url',
  'profile-page-view',
  'public-profile-shell',
  'profile-preview-frame',
] as const;

/** Resolve @rukny/public-profile-ui via node_modules (works in Docker + local). */
export function publicProfileUiResolveAliases(): Record<string, string> {
  const relSrc = './node_modules/@rukny/public-profile-ui/src';
  return {
    '@rukny/public-profile-ui/profile-themes.css': `${relSrc}/profile-themes.css`,
    ...Object.fromEntries(
      SUBPATHS.map((name) => {
        if (name === 'profile-page-view') {
          return [`@rukny/public-profile-ui/${name}`, `${relSrc}/components/profile-page-view.tsx`];
        }
        if (name === 'public-profile-shell') {
          return [`@rukny/public-profile-ui/${name}`, `${relSrc}/components/public-profile-shell.tsx`];
        }
        if (name === 'profile-preview-frame') {
          return [`@rukny/public-profile-ui/${name}`, `${relSrc}/components/profile-preview-frame.tsx`];
        }
        if (name === 'media-url-context') {
          return [`@rukny/public-profile-ui/${name}`, `${relSrc}/media-url-context.tsx`];
        }
        return [`@rukny/public-profile-ui/${name}`, `${relSrc}/${name}.ts`];
      }),
    ),
  };
}
