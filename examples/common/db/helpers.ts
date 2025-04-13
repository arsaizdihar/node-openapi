export function first<T>(array: T[]): T | null {
  return array[0] ?? null;
}

export function firstSure<T>(array: T[]): T {
  const result = array[0];
  if (!result) {
    throw new Error('No element in array');
  }
  return result;
}
