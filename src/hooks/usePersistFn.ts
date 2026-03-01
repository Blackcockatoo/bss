import { useEffect, useRef, useState } from "react";


type noop = (...args: any[]) => any;

/**
 * usePersistFn instead of useCallback to reduce cognitive load
 */
export function usePersistFn<T extends noop>(fn: T) {
  const fnRef = useRef<T>(fn);
  useEffect(() => {
    fnRef.current = fn;
  });

  // Use useState lazy initializer to create the stable wrapper once (pure during render)
  const [persistFn] = useState<T>(() =>
    ((...args: any[]) => fnRef.current!(...args)) as T
  );

  return persistFn;
}
