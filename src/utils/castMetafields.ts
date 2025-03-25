import {
  CustomMetafieldDefinition,
  ResolvedMetafieldInfo,
} from "../types/metafields";
import { castMetafieldValue } from "./castMetafieldValue";
import { renderRichText } from "./renderRichText";

/**
 * Casts normalized metafields to their correct types.
 * @param normalizedMetafields - The output from normalizeMetafields.
 * @param definitions - Array of custom metafield definitions.
 * @param renderRichTextAsHtml - If true, rich_text fields are rendered as HTML.
 * @param transformMetafields - Optional transform function that receives:
 *        raw normalized metafields, the cast result so far, and the array of resolved definitions.
 * @returns A nested object with properly cast metafield values.
 */
export function castMetafields(
  normalizedMetafields: Record<string, Record<string, string>>,
  definitions: CustomMetafieldDefinition[],
  renderRichTextAsHtml: boolean,
  transformMetafields?: (
    raw: Record<string, Record<string, string>>,
    casted: Record<string, any>,
    definitions: ResolvedMetafieldInfo[]
  ) => Record<string, any>
): Record<string, any> {
  const result: Record<string, any> = {};
  const resolvedDefs: ResolvedMetafieldInfo[] = [];

  for (const def of definitions) {
    const [namespace, key] = def.field.split(".");
    const rawValue = normalizedMetafields?.[namespace]?.[key];

    // Build the resolved definition info for further processing.
    resolvedDefs.push({
      namespace,
      key,
      fullKey: def.field,
      type: def.type,
    });

    if (rawValue !== undefined) {
      result[namespace] = result[namespace] || {};
      if (def.type === "rich_text" && renderRichTextAsHtml) {
        console.log(`Rendering rich text for ${def.field}:`, rawValue);
        result[namespace][key] = renderRichText(rawValue);
      } else {
        result[namespace][key] = castMetafieldValue(rawValue, def.type);
      }
    }
  }

  if (transformMetafields) {
    return transformMetafields(normalizedMetafields, result, resolvedDefs);
  }
  return result;
}
