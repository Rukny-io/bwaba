/** Resolve local HeroUI packages for Next.js / Turbopack. */
export function herouiResolveAliases(): Record<string, string> {
  return {
    '@heroui/react': './packages/react/src/index.ts',
    '@heroui/styles': './packages/styles/src/index.ts',
  };
}
