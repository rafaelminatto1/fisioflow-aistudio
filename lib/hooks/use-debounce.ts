import { useState, useEffect } from 'react';

/**
 * Hook customizado que aplica "debounce" a um valor.
 * O valor retornado só será atualizado após o `delay` especificado sem que o valor de entrada tenha mudado.
 * Útil para evitar chamadas excessivas de API em campos de busca, por exemplo.
 *
 * @template T - O tipo do valor a ser "debounced".
 * @param {T} value - O valor a ser "debounced".
 * @param {number} delay - O atraso em milissegundos.
 * @returns {T} O valor "debounced".
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
