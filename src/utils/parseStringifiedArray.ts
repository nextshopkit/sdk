/**
 * Attempts to parse raw JSON (stringified arrays).
 */
export function parseStringifiedArray(value: string): string[] | string {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : value;
  } catch {
    return value;
  }
}
