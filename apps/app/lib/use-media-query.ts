'use client';

import { useEffect, useState } from 'react';

function getMediaQueryMatches(query: string, fallback = false) {
  if (typeof window === 'undefined') return fallback;
  return window.matchMedia(query).matches;
}

export function useMediaQuery(query: string, fallback = false) {
  const [matches, setMatches] = useState(() => getMediaQueryMatches(query, fallback));

  useEffect(() => {
    const media = window.matchMedia(query);
    setMatches(media.matches);

    function handleChange(event: MediaQueryListEvent) {
      setMatches(event.matches);
    }

    media.addEventListener('change', handleChange);
    return () => media.removeEventListener('change', handleChange);
  }, [query]);

  return matches;
}

export function useIsDesktop() {
  return useMediaQuery('(min-width: 768px)');
}
