export const PrimitiveTypes = [
  "single_line_text",
  "multi_line_text",
  "integer",
  "decimal",
  "true_false",
  "json",
  "date",
  "date_and_time",
  "money",
  "rating",
  "url",
  "color",
  "id",
] as const;

export const ReferenceTypes = [
  "Product",
  "Product_variant",
  "Customer",
  "Company",
  "Page",
  "Collection",
  "File",
  "Metaobject",
] as const;

export const UnitTypes = ["weight", "dimension", "volume"] as const;

export type ShopifyCustomFieldType =
  | (typeof PrimitiveTypes)[number]
  | (typeof ReferenceTypes)[number]
  | (typeof UnitTypes)[number];

export interface CustomMetafieldDefinition {
  field: string; // e.g., "custom.title"
  type: ShopifyCustomFieldType;
}
