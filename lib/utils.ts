import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combina nomes de classes do Tailwind CSS de forma inteligente, evitando conflitos.
 * Utiliza `clsx` para lidar com nomes de classes condicionais e `tailwind-merge` para resolver conflitos.
 *
 * @param {...ClassValue[]} inputs - Uma lista de nomes de classes, arrays ou objetos.
 * @returns {string} Uma string com os nomes de classes combinados e otimizados.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
