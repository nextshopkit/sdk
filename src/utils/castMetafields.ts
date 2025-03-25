import { CustomMetafieldDefinition } from "../types/metafields";
import { castMetafieldValue } from "./castMetafieldValue";

export function castMetafields(
  normalizedMetafields: Record<string, Record<string, string>>,
  definitions: CustomMetafieldDefinition[]
): Record<string, any> {
  const result: Record<string, any> = {};

  for (const def of definitions) {
    const [namespace, key] = def.field.split(".");
    const rawValue = normalizedMetafields?.[namespace]?.[key];

    if (rawValue !== undefined) {
      result[namespace] = result[namespace] || {};
      result[namespace][key] = castMetafieldValue(rawValue, def.type);
    }
  }

  return result;
}
