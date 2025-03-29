import { ProductFilter } from "../types/products";

export function buildMetafieldFilter(
  namespace: string,
  key: string,
  values: string[]
): ProductFilter[] {
  return values.map((value) => ({
    productMetafield: {
      namespace,
      key,
      value,
    },
  }));
}
