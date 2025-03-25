var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/utils/buildMetafieldIdentifiers.ts
var buildMetafieldIdentifiers_exports = {};
__export(buildMetafieldIdentifiers_exports, {
  buildMetafieldIdentifiers: () => buildMetafieldIdentifiers
});
function buildMetafieldIdentifiers(metafields) {
  return metafields.map(({ field }) => {
    const [namespace, key] = field.split(".");
    return `{ namespace: "${namespace}", key: "${key}" }`;
  }).join(",\n");
}
var init_buildMetafieldIdentifiers = __esm({
  "src/utils/buildMetafieldIdentifiers.ts"() {
    "use strict";
  }
});

// src/graphql/client.ts
var SHOPIFY_GRAPHQL_URL = process.env.SHOPIFY_GRAPHQL_URL;
var SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
async function fetchShopify(query, variables = {}) {
  if (!SHOPIFY_GRAPHQL_URL || !SHOPIFY_ACCESS_TOKEN) {
    throw new Error("Missing Shopify API credentials");
  }
  const res = await fetch(SHOPIFY_GRAPHQL_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": SHOPIFY_ACCESS_TOKEN
    },
    body: JSON.stringify({ query, variables })
  });
  const json = await res.json();
  if (json.errors) {
    throw new Error(json.errors[0]?.message || "GraphQL error");
  }
  return json;
}

// src/graphql/queries/getProductByHandle.ts
var getProductByHandleQuery = (metafieldIdentifiers) => `
  query getProductByHandle($handle: String!) {
    productByHandle(handle: $handle) {
      id
      title
      handle
      descriptionHtml
      featuredImage {
        originalSrc
        altText
      }
      images(first: 10) {
        edges {
          node {
            originalSrc
            altText
          }
        }
      }
      variants(first: 10) {
        edges {
          node {
            id
            title
            priceV2 { amount, currencyCode }
            compareAtPriceV2 { amount, currencyCode }
            product { title, handle }
          }
        }
      }
      metafields(identifiers: [${metafieldIdentifiers}]) {
        key
        value
      }
    }
  }
`;

// src/utils/normalizeMetafields.ts
function normalizeMetafields(metafields) {
  return metafields.reduce((acc, field) => {
    if (field?.key) {
      acc[field.key] = field.value;
    }
    return acc;
  }, {});
}

// src/graphql/queries/getProductById.ts
var getProductByIdQuery = (metafieldIdentifiers) => `
  query getProductById($id: ID!) {
    node(id: $id) {
      ... on Product {
        id
        title
        handle
        descriptionHtml
        featuredImage {
          originalSrc
          altText
        }
        images(first: 10) {
          edges {
            node {
              originalSrc
              altText
            }
          }
        }
        variants(first: 10) {
          edges {
            node {
              id
              title
              priceV2 { amount, currencyCode }
              compareAtPriceV2 { amount, currencyCode }
              product { title, handle }
            }
          }
        }
        metafields(identifiers: [${metafieldIdentifiers}]) {
          key
          value
        }
      }
    }
  }
`;

// src/products/getProduct.ts
async function getProduct(options) {
  const { handle, id, customMetafields = [] } = options;
  const metafieldIdentifiers = customMetafields.length > 0 ? (init_buildMetafieldIdentifiers(), __toCommonJS(buildMetafieldIdentifiers_exports)).buildMetafieldIdentifiers(
    customMetafields
  ) : "";
  if (!handle && !id) {
    return { data: null, error: "Either handle or id must be provided" };
  }
  const query = id ? getProductByIdQuery(metafieldIdentifiers) : getProductByHandleQuery(metafieldIdentifiers);
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
    const metafields = normalizeMetafields(node.metafields || []);
    const images = (node.images.edges ?? []).map((edge) => ({
      originalSrc: edge.node.originalSrc,
      altText: edge.node.altText ?? null
    }));
    const variants = (node.variants.edges ?? []).map((edge) => {
      const variant = edge.node;
      return {
        id: variant.id,
        variantTitle: variant.title,
        productTitle: variant.product?.title || node.title,
        price: variant.priceV2,
        compareAtPrice: variant.compareAtPriceV2 ?? null
      };
    });
    const defaultPrice = variants[0]?.price || {
      amount: "0",
      currencyCode: "EUR"
    };
    const defaultCompareAtPrice = variants[0]?.compareAtPrice || null;
    const product = {
      id: node.id,
      title: node.title,
      handle: node.handle,
      descriptionHtml: node.descriptionHtml || "",
      featuredImage: node.featuredImage || null,
      images,
      variants,
      price: defaultPrice,
      compareAtPrice: defaultCompareAtPrice,
      metafields
    };
    return { data: product, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "Unexpected error"
    };
  }
}
export {
  getProduct
};
//# sourceMappingURL=index.mjs.map