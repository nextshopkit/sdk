import { fetchShopify } from "../graphql/client";
import { getProductByHandleQuery } from "../graphql/queries/getProductByHandle";
import { safeParseArray } from "../utils/safeParseArray";
import { normalizeMetafields } from "../utils/normalizeMetafields";
import { CustomMetafieldDefinition } from "../types/metafields";
import { FetchProductResult, Product } from "../types/product";
import { getProductByIdQuery } from "../graphql/queries/getProductById";

export interface GetProductOptions {
  id?: string;
  handle?: string;
  customMetafields?: CustomMetafieldDefinition[];
}

export async function getProduct(
  options: GetProductOptions
): Promise<FetchProductResult> {
  const { handle, id, customMetafields = [] } = options;
  const metafieldIdentifiers =
    customMetafields.length > 0
      ? require("../utils/buildMetafieldIdentifiers").buildMetafieldIdentifiers(
          customMetafields
        )
      : "";

  if (!handle && !id) {
    return { data: null, error: "Either handle or id must be provided" };
  }

  const query = id
    ? getProductByIdQuery(metafieldIdentifiers)
    : getProductByHandleQuery(metafieldIdentifiers);

  const variables = id ? { id } : { handle };

  try {
    const json = await fetchShopify(query, { handle });
    if (json.errors && json.errors.length > 0) {
      return { data: null, error: json.errors[0]?.message || "GraphQL error" };
    }
    const node = json.data?.productByHandle;
    if (!node) {
      return { data: null, error: "Product not found" };
    }

    // Normalize metafields using the helper
    const metafields = normalizeMetafields(node.metafields || []);

    // Process images
    const images = (node.images.edges ?? []).map((edge: ImageEdge) => ({
      originalSrc: edge.node.originalSrc,
      altText: edge.node.altText ?? null,
    }));

    // Process variants
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

    // Use first variant's pricing as default
    const defaultPrice = variants[0]?.price || {
      amount: "0",
      currencyCode: "EUR",
    };
    const defaultCompareAtPrice = variants[0]?.compareAtPrice || null;

    // Build final product
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
