export function toJsonString(value: unknown) {
  return JSON.stringify(value);
}

export function parseJsonString<T>(value: string | null | undefined, fallback: T): T {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}
