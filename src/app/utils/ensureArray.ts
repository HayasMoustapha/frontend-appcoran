export function ensureArray<T>(value: T[] | { data?: T[] } | null | undefined): T[] {
  if (Array.isArray(value)) return value;
  if (value && Array.isArray((value as { data?: T[] }).data)) {
    return (value as { data?: T[] }).data ?? [];
  }
  return [];
}
