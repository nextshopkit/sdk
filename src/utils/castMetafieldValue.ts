import { ShopifyCustomFieldType } from "../types/metafields";

export function castMetafieldValue(
  rawValue: string,
  type: ShopifyCustomFieldType
): unknown {
  switch (type) {
    case "integer":
    case "decimal":
    case "money":
    case "rating":
    case "weight":
    case "volume":
    case "dimension":
      return Number(rawValue);

    case "true_false":
      return rawValue === "true";

    case "json":
      try {
        return JSON.parse(rawValue);
      } catch {
        return rawValue; // fallback to raw string if invalid
      }

    case "date":
    case "date_and_time":
      return new Date(rawValue); // returns a JS Date object

    case "color":
    case "url":
    case "id":
    case "single_line_text":
    case "multi_line_text":
    case "rich_text":
      return rawValue;

    case "Product":
    case "Product_variant":
    case "Customer":
    case "Company":
    case "Page":
    case "Collection":
    case "File":
    case "Metaobject":
      return rawValue; // usually a Shopify GID like gid://shopify/Product/123

    default:
      return rawValue;
  }
}
