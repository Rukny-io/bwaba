const SUBPATHS = [
  'apply-security-headers',
  'security-headers',
  'conditional-logic-eval',
  'public-form-utils',
  'pricing-plans',
] as const;

/** Resolve @rukny/forms-shared via node_modules (works in Docker + local). */
export function formsSharedResolveAliases(): Record<string, string> {
  const relSrc = './node_modules/@rukny/forms-shared/src';
  return Object.fromEntries(
    SUBPATHS.map((name) => [
      `@rukny/forms-shared/${name}`,
      `${relSrc}/${name}.ts`,
    ]),
  );
}
