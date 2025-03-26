import { fetchShopify } from "../graphql/client";
import { getProductByHandleQuery } from "../graphql/queries/getProductByHandle";
import { getProductByIdQuery } from "../graphql/queries/getProductById";
import { buildMetafieldIdentifiers } from "../utils/buildMetafieldIdentifiers";
import { normalizeMetafields } from "../utils/normalizeMetafields";
import { castMetafields } from "../utils/castMetafields";
import { safeParseArray } from "../utils/safeParseArray";
import {
  CustomMetafieldDefinition,
  ResolvedMetafieldInfo,
} from "../types/metafields";
import { FetchProductResult, Product } from "../types/product";
import { ImageEdge, VariantEdge } from "../types/edges";

export interface GetProductOptions {
  id?: string;
  handle?: string;
  customMetafields?: CustomMetafieldDefinition[];
  options: {
    locale?: string;
    resolveFiles?: boolean;
    renderRichTextAsHtml?: boolean;
    transformMetafields?: (
      raw: Record<string, Record<string, string>>,
      casted: Record<string, any>,
      definitions: ResolvedMetafieldInfo[]
    ) => Record<string, any>;
  };
}

export async function getProduct(
  options: GetProductOptions
): Promise<FetchProductResult> {
  const { handle, id, customMetafields = [], options: settings } = options;
  const {
    renderRichTextAsHtml = false,
    transformMetafields,
    locale,
    resolveFiles = true,
  } = settings;

  console.log("Fetching product with options:", options);

  if (!handle && !id) {
    return { data: null, error: "Either handle or id must be provided" };
  }

  // Build metafield identifiers based on the provided definitions.
  const metafieldIdentifiers =
    customMetafields.length > 0
      ? buildMetafieldIdentifiers(customMetafields)
      : "";

  console.log("Metafield Identifiers:", metafieldIdentifiers);

  // Choose the proper query based on the provided identifier.
  const query = id
    ? getProductByIdQuery(metafieldIdentifiers)
    : getProductByHandleQuery(metafieldIdentifiers);

  console.log("Query:", query);
  // Pass locale if available (for localized fields).
  const variables = id ? { id } : { handle, locale };

  try {
    const json = await fetchShopify(query, variables);
    console.log("full response", json);
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
    console.log("raw metafields", rawMetafields);

    const metafields =
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

    console.log("casted metafields", metafields);

    // Process images and apply imageLimit if provided.
    let images = (node.images.edges ?? []).map((edge: ImageEdge) => ({
      originalSrc: edge.node.originalSrc,
      altText: edge.node.altText ?? null,
    }));

    // Process variants and apply variantLimit if provided.
    let variants = (node.variants.edges ?? []).map((edge: VariantEdge) => {
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
