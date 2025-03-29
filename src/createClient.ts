import { getProduct } from "./products/getProduct";
import { getProducts } from "./products/getProducts";
import { GetProductOptions } from "./types/product";
import { GetProductsOptions } from "./types/products";

// sdk/createClient.ts
export interface ShopifyClientConfig {
  shop: string;
  token: string;
  apiVersion?: string; // default to latest
}

export function createShopifyClient(config: ShopifyClientConfig) {
  const apiVersion = config.apiVersion || "2025-01";
  const endpoint = `https://${config.shop}/api/${apiVersion}/graphql.json`;

  async function fetchShopify<T = any>(
    query: string,
    variables: Record<string, any> = {}
  ): Promise<T> {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": config.token,
      },
      body: JSON.stringify({ query, variables }),
    });

    const json = await res.json();

    if (json.errors) {
      throw new Error(json.errors[0]?.message || "Shopify GraphQL error");
    }

    return json;
  }

  return {
    fetchShopify, // internal
    getProduct: (args: GetProductOptions) => getProduct(fetchShopify, args),
    getProducts: (args: GetProductsOptions) => getProducts(fetchShopify, args),
  };
}
