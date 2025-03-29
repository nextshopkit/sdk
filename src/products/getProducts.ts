// UTILS
import { buildMetafieldIdentifiers } from "../utils/buildMetafieldIdentifiers";
import { normalizeMetafields } from "../utils/normalizeMetafields";
import { castMetafields } from "../utils/castMetafields";
import { safeParseArray } from "../utils/safeParseArray";
import { camelizeMetafields } from "../utils/camelizeKeys";
import { formatAvailableFilters } from "../utils/formatAvailableFilters";
import { getCollectionProductsQuery } from "../graphql/queries/getCollectionProducts";

// TYPES
import type { FetchShopify } from "../types/shared";
import type { Product, Variant, VariantEdge } from "../types/product";
import type {
  FetchProductsResult,
  ProductsPageInfo,
  FilterGroup,
  GetProductsOptions,
} from "../types/products";

export async function getProducts(
  fetchShopify: FetchShopify,
  config: GetProductsOptions
): Promise<FetchProductsResult> {
  const {
    collectionHandle,
    limit = 12,
    cursor,
    reverse = false,
    sortKey = "RELEVANCE",
    filters = [],
    customMetafields = [],
    options: {
      resolveFiles = true,
      renderRichTextAsHtml = false,
      transformMetafields,
      camelizeKeys = true,
    } = {},
  } = config;

  const metafieldIdentifiers =
    customMetafields.length > 0
      ? buildMetafieldIdentifiers(customMetafields)
      : "";

  const query = getCollectionProductsQuery(
    limit,
    metafieldIdentifiers,
    filters.length > 0
  );

  const variables = {
    handle: collectionHandle,
    cursor,
    reverse,
    sortKey,
    filters,
  };

  try {
    const json = await fetchShopify(query, variables);
    const collection = json.data?.collection;

    if (!collection || !collection.products) {
      return {
        data: [],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          endCursor: null,
          startCursor: null,
        },
        error: "Collection or products not found",
      };
    }

    const edges = safeParseArray(collection.products.edges);
    const products: Product[] = [];

    for (const edge of edges) {
      const node = edge.node;

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

      const variants: Variant[] = safeParseArray(node.variants?.edges).map(
        (edge: VariantEdge) => {
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
        }
      );

      const product: Product = {
        id: node.id,
        title: node.title,
        handle: node.handle,
        descriptionHtml: node.descriptionHtml || "",
        featuredImage: node.featuredImage || null,
        images: safeParseArray(node.images?.edges).map((edge) => edge.node),
        variants,
        price: {
          amount: variants[0]?.price?.amount,
          currencyCode: variants[0]?.price?.currencyCode,
        },
        compareAtPrice: variants[0]?.compareAtPrice
          ? {
              amount: variants[0].compareAtPrice.amount,
              currencyCode: variants[0].compareAtPrice.currencyCode,
            }
          : null,
        metafields,
      };

      products.push(product);
    }

    const pageInfo: ProductsPageInfo = collection.products.pageInfo;
    const rawFilters = collection.products.filters || [];
    const availableFilters: FilterGroup[] = formatAvailableFilters(rawFilters);

    return { data: products, pageInfo, availableFilters, error: null };
  } catch (error) {
    return {
      data: [],
      pageInfo: {
        hasNextPage: false,
        hasPreviousPage: false,
        endCursor: null,
        startCursor: null,
      },
      error: error instanceof Error ? error.message : "Unexpected error",
    };
  }
}
