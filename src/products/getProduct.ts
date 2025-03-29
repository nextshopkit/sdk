import { getProductByHandleQuery } from "../graphql/queries/getProductByHandle";
import { getProductByIdQuery } from "../graphql/queries/getProductById";
import { buildMetafieldIdentifiers } from "../utils/buildMetafieldIdentifiers";
import { normalizeMetafields } from "../utils/normalizeMetafields";
import { castMetafields } from "../utils/castMetafields";
import { safeParseArray } from "../utils/safeParseArray";
import { camelizeMetafields } from "../utils/camelizeKeys";

import type {
  FetchProductResult,
  GetProductOptions,
  Product,
  Variant,
  VariantEdge,
} from "../types/product";
import type { ImageEdge } from "../types/edges";
import type { FetchShopify } from "../types/shared"; // ← Make sure this type exists

export async function getProduct(
  fetchShopify: FetchShopify,
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

  const metafieldIdentifiers =
    customMetafields.length > 0
      ? buildMetafieldIdentifiers(customMetafields)
      : "";

  const query = id
    ? getProductByIdQuery(metafieldIdentifiers)
    : getProductByHandleQuery(metafieldIdentifiers);

  const variables = id ? { id } : { handle, locale };

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

    const rawMetafields = normalizeMetafields(
      node.metafields || [],
      customMetafields
    );

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

    const images = safeParseArray<ImageEdge>(node.images?.edges).map(
      (edge) => ({
        originalSrc: edge.node.originalSrc,
        altText: edge.node.altText ?? null,
      })
    );

    const variants: Variant[] = safeParseArray<VariantEdge>(
      node.variants?.edges
    ).map((edge) => {
      const variant = edge.node;
      return {
        id: variant.id,
        productTitle: variant.product?.title || node.title,
        variantTitle:
          variant.title === "Default Title" ? node.title : variant.title,
        price: {
          amount: parseFloat(variant.priceV2.amount),
          currencyCode: variant.priceV2.currencyCode,
        },
        compareAtPrice: variant.compareAtPriceV2
          ? {
              amount: parseFloat(variant.compareAtPriceV2.amount),
              currencyCode: variant.compareAtPriceV2.currencyCode,
            }
          : null,
      };
    });

    const defaultPrice = variants[0]?.price ?? {
      amount: 0,
      currencyCode: "EUR",
    };

    const defaultCompareAtPrice = variants[0]?.compareAtPrice ?? null;

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
