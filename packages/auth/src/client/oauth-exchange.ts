export type ExchangeCodeFn<T> = (code: string) => Promise<T>;

/**
 * Deduplicate one-time code exchange across React Strict Mode remounts /
 * concurrent effects. The Redis code is single-use; a second POST always 400s.
 */
export function createExchangeCodeOnce<T>(
  exchangeCode: ExchangeCodeFn<T>,
): (code: string) => Promise<T> {
  const exchangeInFlight = new Map<string, Promise<T>>();

  return function exchangeCodeOnce(code: string): Promise<T> {
    const existing = exchangeInFlight.get(code);
    if (existing) return existing;

    const pending = exchangeCode(code).finally(() => {
      if (typeof window !== 'undefined') {
        window.setTimeout(() => {
          exchangeInFlight.delete(code);
        }, 30_000);
      } else {
        exchangeInFlight.delete(code);
      }
    });

    exchangeInFlight.set(code, pending);
    return pending;
  };
}
