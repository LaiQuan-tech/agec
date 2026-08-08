/**
 * Joins class names, dropping falsy values. Six lines instead of a clsx
 * dependency — the admin never needs Tailwind class conflict resolution
 * because it doesn't compose variants deeply.
 */
export function cn(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}
