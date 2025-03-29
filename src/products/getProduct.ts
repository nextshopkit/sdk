// GRAPHQL
import { fetchShopify } from "../graphql/client";
import { getProductByHandleQuery } from "../graphql/queries/getProductByHandle";
import { getProductByIdQuery } from "../graphql/queries/getProductById";

// UTILS
import { buildMetafieldIdentifiers } from "../utils/buildMetafieldIdentifiers";
import { normalizeMetafields } from "../utils/normalizeMetafields";
import { castMetafields } from "../utils/castMetafields";
import { safeParseArray } from "../utils/safeParseArray";
import { camelizeMetafields } from "../utils/camelizeKeys";

// TYPES
import {
  FetchProductResult,
  GetProductOptions,
  Product,
  Variant,
  VariantEdge,
} from "../types/product";
import { ImageEdge } from "../types/edges";

export async function getProduct(
  options: GetProductOptions
): Promise<FetchProductResult> {
  const { handle, id, customMetafields = [], options: settings } = options;
  const {
    locale,
    renderRichTextAsHtml = false,
    camelizeKeys = true,
    resolveFiles = true,
    transformMetafields,
  } = settings;

  if (!handle && !id) {
    return { data: null, error: "Either handle or id must be provided" };
  }

  // Build metafield identifiers based on the provided definitions.
  const metafieldIdentifiers =
    customMetafields.length > 0
      ? buildMetafieldIdentifiers(customMetafields)
      : "";

  // Choose the proper query based on the provided identifier.
  const query = id
    ? getProductByIdQuery(metafieldIdentifiers)
    : getProductByHandleQuery(metafieldIdentifiers);

  // Pass locale if available (for localized fields).
  const variables = id ? { id } : { handle, locale };

  try {
    const json = await fetchShopify(query, variables);

    if (json.errors?.length) {
      return {
        data: null,
        error: json.errors[0]?.message || "GraphQL error",
      };
    }

    // For id query, product is returned as "node"; for handle query, as "productByHandle".
    const node = id ? json.data?.node : json.data?.productByHandle;

    if (!node) {
      return { data: null, error: "Product not found" };
    }

    // Normalize raw metafields (e.g. transform keys "custom.category" into nested objects)
    const rawMetafields = normalizeMetafields(
      node.metafields || [],
      customMetafields
    );
    // Cast the metafields to proper JS types, optionally transforming them.

    const castedMetafields =
      customMetafields.length > 0
        ? await castMetafields(
            rawMetafields,
            customMetafields,
            renderRichTextAsHtml,
            transformMetafields,
            resolveFiles,
            fetchShopify
          )
        : rawMetafields;

    const metafields =
      camelizeKeys !== false
        ? camelizeMetafields(castedMetafields)
        : castedMetafields;

    let images = safeParseArray<ImageEdge>(node.images?.edges).map((edge) => ({
      originalSrc: edge.node.originalSrc,
      altText: edge.node.altText ?? null,
    }));

    const variants: Variant[] = safeParseArray(node.variants?.edges).map(
      (edge: VariantEdge) => {
        const variant = edge.node;
        return {
          id: variant.id,
          productTitle: variant.product?.title || node.title,
          variantTitle:
            variant.title === "Default Title" ? node.title : variant.title,
          price: {
            amount: parseFloat(variant.priceV2.amount), // number
            currencyCode: variant.priceV2.currencyCode,
          },
          compareAtPrice: variant.compareAtPriceV2
            ? {
                amount: parseFloat(variant.compareAtPriceV2.amount),
                currencyCode: variant.compareAtPriceV2?.currencyCode,
              }
            : null,
        };
      }
    );

    const defaultPrice = variants[0]?.price
      ? {
          amount: variants[0].price.amount, // number
          currencyCode: variants[0].price.currencyCode,
        }
      : {
          amount: 0.0,
          currencyCode: "EUR",
        };

    const defaultCompareAtPrice = variants[0]?.compareAtPrice
      ? {
          amount: variants[0].compareAtPrice.amount,
          currencyCode: variants[0].compareAtPrice.currencyCode,
        }
      : null;

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
