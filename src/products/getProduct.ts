import { fetchShopify } from "../graphql/client";
import { getProductByHandleQuery } from "../graphql/queries/getProductByHandle";
import { getProductByIdQuery } from "../graphql/queries/getProductById";
import { buildMetafieldIdentifiers } from "../utils/buildMetafieldIdentifiers";
import { normalizeMetafields } from "../utils/normalizeMetafields";

import { safeParseArray } from "../utils/safeParseArray";
import { CustomMetafieldDefinition } from "../types/metafields";
import { FetchProductResult, Product } from "../types/product";
import { ImageEdge, VariantEdge } from "../types/edges";
import { castMetafields } from "../utils/castMetafields";

export interface GetProductOptions {
  id?: string;
  handle?: string;
  customMetafields?: CustomMetafieldDefinition[];
}

export async function getProduct(
  options: GetProductOptions
): Promise<FetchProductResult> {
  const { handle, id, customMetafields = [] } = options;

  if (!handle && !id) {
    return { data: null, error: "Either handle or id must be provided" };
  }

  const metafieldIdentifiers =
    customMetafields.length > 0
      ? buildMetafieldIdentifiers(customMetafields)
      : "";

  const query = id
    ? getProductByIdQuery(metafieldIdentifiers)
    : getProductByHandleQuery(metafieldIdentifiers);

  const variables = id ? { id } : { handle };

  try {
    const json = await fetchShopify(query, variables);

    if (json.errors?.length) {
      return {
        data: null,
        error: json.errors[0]?.message || "GraphQL error",
      };
    }

    const node = id ? json.data?.node : json.data?.productByHandle;

    if (!node) {
      return { data: null, error: "Product not found" };
    }

    // Normalize & Cast metafields
    const rawMetafields = normalizeMetafields(node.metafields || []);
    const metafields =
      customMetafields.length > 0
        ? castMetafields(rawMetafields, customMetafields)
        : rawMetafields;

    // Images
    const images = (node.images.edges ?? []).map((edge: ImageEdge) => ({
      originalSrc: edge.node.originalSrc,
      altText: edge.node.altText ?? null,
    }));

    // Variants
    const variants = (node.variants.edges ?? []).map((edge: VariantEdge) => {
      const variant = edge.node;
      return {
        id: variant.id,
        variantTitle: variant.title,
        productTitle: variant.product?.title || node.title,
        price: variant.priceV2,
        compareAtPrice: variant.compareAtPriceV2 ?? null,
      };
    });

    const defaultPrice = variants[0]?.price || {
      amount: "0",
      currencyCode: "EUR",
    };

    const defaultCompareAtPrice = variants[0]?.compareAtPrice || null;

    const product: Product = {
      id: node.id,
      title: node.title,
      handle: node.handle,
      descriptionHtml: node.descriptionHtml || "",
      featuredImage: node.featuredImage || null,
      images,
      variants,
      price: defaultPrice,
      compareAtPrice: defaultCompareAtPrice,
      metafields,
    };

    return { data: product, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "Unexpected error",
    };
  }
}
