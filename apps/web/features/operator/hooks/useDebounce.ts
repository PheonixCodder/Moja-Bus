"use client";

import { useEffect, useState } from "react";

/**
 * Returns a debounced version of `value` that only updates
 * after `delay` milliseconds of inactivity.
 *
 * @example
 * const debouncedSearch = useDebounce(search, 300);
 * // Pass `debouncedSearch` to your query, not `search`.
 */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
