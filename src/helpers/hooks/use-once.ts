import { useRef } from 'react';

export function useOnce<T>(fn: () => T): T {
  const ref = useRef<OnceValue<T> | null>(null);

  if (ref.current === null) {
    ref.current = { value: fn() };
  }

  return ref.current?.value;
}

type OnceValue<T> = { value: T };
