import { CustomMetafieldDefinition } from "../types/metafields";

type Metafield = { key: string; value: string };

export function normalizeMetafields(
  metafields: (Metafield | null)[],
  definitions: CustomMetafieldDefinition[]
): Record<string, any> {
  const result: Record<string, any> = {};

  // Build a map from key → namespace based on definitions
  const keyToNamespace = new Map<string, string>();
  for (const def of definitions) {
    const [namespace, key] = def.field.split(".");
    keyToNamespace.set(key, namespace);
  }

  for (const field of metafields) {
    if (!field?.key) continue;

    const key = field.key;
    const namespace = keyToNamespace.get(key) || "global";

    if (!result[namespace]) {
      result[namespace] = {};
    }

    result[namespace][key] = field.value;
  }

  return result;
}
