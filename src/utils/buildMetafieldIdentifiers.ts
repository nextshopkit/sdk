import { CustomMetafieldDefinition } from "../types/metafields";

export function buildMetafieldIdentifiers(
  metafields: CustomMetafieldDefinition[]
): string {
  return metafields
    .map(({ field }) => {
      const [namespace, key] = field.split(".");
      return `{ namespace: "${namespace}", key: "${key}" }`;
    })
    .join(",\n");
}
