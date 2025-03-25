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
    renderRichTextAsHtml?: boolean;
    includeRawMetafields?: boolean;
    imageLimit?: number;
    variantLimit?: number;
    transformMetafields?: (
      raw: Record<string, Record<string, string>>,
      casted: Record<string, any>,
      definitions: ResolvedMetafieldInfo[]
    ) => Record<string, any>;
    locale: string;
    returnFullResponse: boolean;
    resolveReferences: true;
  };
}

export async function getProduct(
  options: GetProductOptions
): Promise<FetchProductResult> {
  const { handle, id, customMetafields = [], options: settings } = options;
  const {
    renderRichTextAsHtml = false,
    includeRawMetafields = false,
    imageLimit,
    variantLimit,
    transformMetafields,
    locale,
    returnFullResponse,
    resolveReferences,
  } = settings;

  if (!handle && !id) {
    return { data: null, error: "Either handle or id must be provided" };
  }

  // Build metafield identifiers if definitions are provided.
  const metafieldIdentifiers =
    customMetafields.length > 0
      ? buildMetafieldIdentifiers(customMetafields)
      : "";

  // Choose the query based on provided identifier (id vs. handle).
  const query = id
    ? getProductByIdQuery(metafieldIdentifiers)
    : getProductByHandleQuery(metafieldIdentifiers);

  // Pass locale if needed (for localized fields)
  const variables = id ? { id } : { handle, locale };

  try {
    const json = await fetchShopify(query, variables);

    if (json.errors?.length) {
      return {
        data: null,
        error: json.errors[0]?.message || "GraphQL error",
      };
    }

    // For id query, Shopify returns the product under "node".
    // For handle query, it returns it under "productByHandle".
    const node = id ? json.data?.node : json.data?.productByHandle;

    if (!node) {
      return { data: null, error: "Product not found" };
    }

    // Normalize raw metafields from Shopify.
    const rawMetafields = normalizeMetafields(node.metafields || []);
    // Cast metafields using definitions and optionally transform them.
    const metafields =
      customMetafields.length > 0
        ? castMetafields(
            rawMetafields,
            customMetafields,
            renderRichTextAsHtml,
            transformMetafields
          )
        : rawMetafields;

    // Process images; apply imageLimit if provided.
    let images = (node.images.edges ?? []).map((edge: ImageEdge) => ({
      originalSrc: edge.node.originalSrc,
      altText: edge.node.altText ?? null,
    }));
    if (imageLimit && images.length > imageLimit) {
      images = images.slice(0, imageLimit);
    }

    // Process variants; apply variantLimit if provided.
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
    if (variantLimit && variants.length > variantLimit) {
      variants = variants.slice(0, variantLimit);
    }

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

    // Optionally include the full raw Shopify response for debugging or other needs.
    const fullResponse = includeRawMetafields ? json : undefined;

    // If returnFullResponse is true, attach the raw response to the result.
    return { data: product, error: null, fullResponse };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "Unexpected error",
    };
  }
}
