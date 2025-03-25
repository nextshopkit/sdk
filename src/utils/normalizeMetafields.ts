type Metafield = { key: string; value: string };

export function normalizeMetafields(
  metafields: (Metafield | null)[]
): Record<string, string> {
  return metafields.reduce((acc, field) => {
    if (field?.key) {
      acc[field.key] = field.value;
    }
    return acc;
  }, {} as Record<string, string>);
}
