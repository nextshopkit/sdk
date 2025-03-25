type Metafield = { key: string; value: string };

export function normalizeMetafields(
  metafields: (Metafield | null)[]
): Record<string, any> {
  const result: Record<string, any> = {};

  for (const field of metafields) {
    if (!field?.key) continue;
    const [namespace, key] = field.key.includes(".")
      ? field.key.split(".")
      : ["global", field.key];

    if (!result[namespace]) {
      result[namespace] = {};
    }

    result[namespace][key] = field.value;
  }

  return result;
}
