'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { MediaUrlResolver } from './types';

const MediaUrlContext = createContext<MediaUrlResolver>((path) => path ?? null);

export function MediaUrlProvider({
  resolve,
  children,
}: {
  resolve: MediaUrlResolver;
  children: ReactNode;
}) {
  return <MediaUrlContext.Provider value={resolve}>{children}</MediaUrlContext.Provider>;
}

export function useMediaUrl(): MediaUrlResolver {
  return useContext(MediaUrlContext);
}
