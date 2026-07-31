'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  FORMS_PREFERENCES_CHANGED_EVENT,
  readFormsPreferences,
  writeFormsPreferences,
  type FormsPreferences,
} from '@/lib/forms-preferences';

export function useFormsPreferences() {
  const [preferences, setPreferences] = useState<FormsPreferences>(() =>
    readFormsPreferences(),
  );

  useEffect(() => {
    const sync = () => setPreferences(readFormsPreferences());

    window.addEventListener(FORMS_PREFERENCES_CHANGED_EVENT, sync);
    window.addEventListener('storage', sync);

    return () => {
      window.removeEventListener(FORMS_PREFERENCES_CHANGED_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const update = useCallback((patch: Partial<FormsPreferences>) => {
    setPreferences(writeFormsPreferences(patch));
  }, []);

  return { preferences, update };
}
