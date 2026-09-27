'use client';

import { useEffect, useState } from 'react';

export function useResilientImage(imageUrl: string | null) {
  const [failed, setFailed] = useState(false);
  const [retryTick, setRetryTick] = useState(0);

  useEffect(() => {
    setFailed(false);
    setRetryTick(0);
  }, [imageUrl]);

  useEffect(() => {
    const retry = () => {
      setFailed(false);
      setRetryTick((tick) => tick + 1);
    };

    window.addEventListener('online', retry);
    return () => window.removeEventListener('online', retry);
  }, []);

  return {
    showImage: Boolean(imageUrl) && !failed,
    imageKey: imageUrl ? `${imageUrl}:${retryTick}` : 'empty',
    onError: () => setFailed(true),
  };
}
