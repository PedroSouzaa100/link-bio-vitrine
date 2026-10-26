import { useEffect, useState } from 'react';

export function useStoredState<T>(key: string, fallback: T, validate: (value: unknown) => T) {
  const [state, setState] = useState<T>(() => {
    try {
      const value = window.localStorage.getItem(key);
      return value === null ? fallback : validate(JSON.parse(value));
    } catch {
      return fallback;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(state));
    } catch {
      // Browsers with storage disabled still support the current session.
    }
  }, [key, state]);

  return [state, setState] as const;
}
