"use strict";
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

// src/utils/resolveShopifyFiles.ts
var resolveShopifyFiles_exports = {};
__export(resolveShopifyFiles_exports, {
  resolveShopifyFiles: () => resolveShopifyFiles
});
async function resolveShopifyFiles(fileIds, fetchShopify2) {
  const resultMap = {};
  if (fileIds.length === 0)
    return resultMap;
  try {
    const res = await fetchShopify2(FILES_QUERY, { ids: fileIds });
    const nodes = res.data?.nodes || [];
    for (const file of nodes) {
      if (file?.id) {
        resultMap[file.id] = file;
      }
    }
    return resultMap;
  } catch (err) {
    console.error("Error resolving files:", err);
    return resultMap;
  }
}
var FILES_QUERY;
var init_resolveShopifyFiles = __esm({
  "src/utils/resolveShopifyFiles.ts"() {
    "use strict";
    FILES_QUERY = `
    query getFiles($ids: [ID!]!) {
    nodes(ids: $ids) {
        ... on GenericFile {
        id
        url
        mimeType
        alt
        originalFileSize
        previewImage {
            id
            url
        }
        }
    }
    }
`;
  }
});

// src/index.ts
var src_exports = {};
__export(src_exports, {
  getProduct: () => getProduct,
  getProducts: () => getProducts
});
module.exports = __toCommonJS(src_exports);

// src/graphql/client.ts
var SHOPIFY_GRAPHQL_URL = process.env.SHOPIFY_GRAPHQL_URL;
var SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
var REQUIRED_API_VERSION = "2025-01";
async function fetchShopify(query, variables = {}) {
  if (!SHOPIFY_GRAPHQL_URL || !SHOPIFY_ACCESS_TOKEN) {
    throw new Error("Missing Shopify API credentials");
  }
  const versionMatch = SHOPIFY_GRAPHQL_URL.match(
    /\/api\/([\d-]+)\/graphql\.json/
  );
  const currentVersion = versionMatch?.[1];
  if (currentVersion && currentVersion !== REQUIRED_API_VERSION) {
    console.warn(
      `\u26A0\uFE0F Shopify Storefront API version "${currentVersion}" detected. This SDK requires "${REQUIRED_API_VERSION}" for full compatibility. Some features may not work as expected.`
    );
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

// src/utils/buildMetafieldIdentifiers.ts
function buildMetafieldIdentifiers(metafields) {
  return metafields.map(({ field }) => {
    const [namespace, key] = field.split(".");
    return `{ namespace: "${namespace}", key: "${key}" }`;
  }).join(",\n");
}

// src/utils/normalizeMetafields.ts
function normalizeMetafields(metafields, definitions) {
  const result = {};
  const keyToNamespace = /* @__PURE__ */ new Map();
  for (const def of definitions) {
    const [namespace, key] = def.field.split(".");
    keyToNamespace.set(key, namespace);
  }
  for (const field of metafields) {
    if (!field?.key)
      continue;
    const key = field.key;
    const namespace = keyToNamespace.get(key) || "global";
    if (!result[namespace]) {
      result[namespace] = {};
    }
    result[namespace][key] = field.value;
  }
  return result;
}

// src/utils/parseStringifiedArray.ts
function parseStringifiedArray(value) {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : value;
  } catch {
    return value;
  }
}

// src/utils/castMetafieldValue.ts
function castMetafieldValue(rawValue, type) {
  switch (type) {
    case "integer":
    case "decimal":
    case "money":
    case "rating":
    case "weight":
    case "volume":
    case "dimension":
      return Number(rawValue);
    case "true_false":
      return rawValue === "true";
    case "json":
      try {
        return JSON.parse(rawValue);
      } catch {
        return rawValue;
      }
    case "date":
    case "date_and_time":
      return new Date(rawValue);
    case "color":
    case "url":
    case "id":
    case "single_line_text":
    case "multi_line_text":
    case "rich_text":
      return rawValue;
    case "Product":
    case "Product_variant":
    case "Customer":
    case "Company":
    case "Page":
    case "Collection":
    case "File":
    case "Metaobject":
      return parseStringifiedArray(rawValue);
    default:
      return rawValue;
  }
}

// src/utils/renderRichText.ts
function renderRichText(schema, options = {}) {
  let { scoped, classes, newLineToBreak } = options;
  let html = "";
  if (typeof schema === "string") {
    try {
      schema = JSON.parse(schema);
    } catch (error) {
      console.error("Error parsing rich text schema:", error);
      return schema;
    }
  }
  if (typeof options === "string" || typeof options === "boolean") {
    scoped = options;
  }
  if (schema && schema.type === "root" && Array.isArray(schema.children) && schema.children.length > 0) {
    if (scoped) {
      const className = scoped === true ? "rte" : scoped;
      html += `<div class="${className}">${renderRichText(
        schema.children,
        options
      )}</div>`;
    } else {
      html += renderRichText(schema.children, options);
    }
  } else if (Array.isArray(schema)) {
    for (const el of schema) {
      switch (el.type) {
        case "paragraph":
          html += buildParagraph(el, options);
          break;
        case "heading":
          html += buildHeading(el, options);
          break;
        case "list":
          html += buildList(el, options);
          break;
        case "list-item":
          html += buildListItem(el, options);
          break;
        case "link":
          html += buildLink(el, options);
          break;
        case "text":
          html += buildText(el, options);
          break;
        default:
          break;
      }
    }
  }
  return html;
}
function getClass(tag, classes) {
  if (classes && classes[tag]) {
    return classes[tag];
  }
  return null;
}
function outputAttributes(attributes) {
  if (!attributes)
    return "";
  return Object.keys(attributes).filter((key) => attributes[key]).map((key) => ` ${key}="${attributes[key]}"`).join("");
}
function createElement(tag, classes, content, attributes = {}) {
  const className = getClass(tag, classes);
  if (className) {
    attributes = { ...attributes, class: className };
  }
  return `<${tag}${outputAttributes(attributes)}>${content}</${tag}>`;
}
function buildParagraph(el, options) {
  const { classes } = options;
  return createElement("p", classes, renderRichText(el?.children, options));
}
function buildHeading(el, options) {
  const { classes } = options;
  const tag = `h${el?.level || 1}`;
  return createElement(tag, classes, renderRichText(el?.children, options));
}
function buildList(el, options) {
  const { classes } = options;
  const tag = el?.listType === "ordered" ? "ol" : "ul";
  return createElement(tag, classes, renderRichText(el?.children, options));
}
function buildListItem(el, options) {
  const { classes } = options;
  return createElement("li", classes, renderRichText(el?.children, options));
}
function buildLink(el, options) {
  const { classes } = options;
  const attributes = {
    href: el?.url,
    title: el?.title,
    target: el?.target
  };
  return createElement(
    "a",
    classes,
    renderRichText(el?.children, options),
    attributes
  );
}
function buildText(el, options) {
  const { classes, newLineToBreak } = options;
  if (el?.bold && el?.italic) {
    return createElement(
      "strong",
      classes,
      createElement("em", classes, el?.value)
    );
  } else if (el?.bold) {
    return createElement("strong", classes, el?.value);
  } else if (el?.italic) {
    return createElement("em", classes, el?.value);
  } else {
    return newLineToBreak ? el?.value?.replace(/\n/g, "<br>") || "" : el?.value || "";
  }
}

// src/utils/castMetafields.ts
async function castMetafields(normalizedMetafields, definitions, renderRichTextAsHtml, transformMetafields, resolveFiles = false, fetchShopify2) {
  const result = {};
  const resolvedDefs = [];
  const fileGIDs = [];
  for (const def of definitions) {
    const [namespace, key] = def.field.split(".");
    const rawValue = normalizedMetafields?.[namespace]?.[key];
    resolvedDefs.push({
      namespace,
      key,
      fullKey: def.field,
      type: def.type
    });
    if (rawValue === void 0)
      continue;
    result[namespace] = result[namespace] || {};
    if (def.type === "rich_text" && renderRichTextAsHtml) {
      result[namespace][key] = renderRichText(rawValue);
      continue;
    }
    if (def.type === "File" && resolveFiles) {
      const casted = castMetafieldValue(rawValue, def.type);
      if (Array.isArray(casted)) {
        fileGIDs.push(...casted);
      } else if (typeof casted === "string") {
        fileGIDs.push(casted);
      }
      result[namespace][key] = casted;
      continue;
    }
    result[namespace][key] = castMetafieldValue(rawValue, def.type);
  }
  if (resolveFiles && fileGIDs.length > 0 && fetchShopify2) {
    const { resolveShopifyFiles: resolveShopifyFiles2 } = await Promise.resolve().then(() => (init_resolveShopifyFiles(), resolveShopifyFiles_exports));
    const fileMap = await resolveShopifyFiles2(fileGIDs, fetchShopify2);
    for (const def of definitions) {
      if (def.type !== "File")
        continue;
      const [namespace, key] = def.field.split(".");
      const raw = result[namespace]?.[key];
      if (Array.isArray(raw)) {
        result[namespace][key] = raw.map((gid) => fileMap[gid] || gid);
      } else if (typeof raw === "string") {
        result[namespace][key] = fileMap[raw] || raw;
      }
    }
  }
  if (typeof transformMetafields === "function") {
    return transformMetafields(normalizedMetafields, result, resolvedDefs);
  }
  return result;
}

// src/utils/safeParseArray.ts
function safeParseArray(value) {
  return Array.isArray(value) ? value : [];
}

// src/utils/camelizeKeys.ts
var import_lodash = require("lodash");
function camelizeMetafields(obj) {
  if (Array.isArray(obj)) {
    return obj.map(camelizeMetafields);
  }
  if (obj !== null && typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [
        (0, import_lodash.camelCase)(key),
        camelizeMetafields(value)
      ])
    );
  }
  return obj;
}

// src/products/getProduct.ts
async function getProduct(options) {
  const { handle, id, customMetafields = [], options: settings } = options;
  const {
    locale,
    renderRichTextAsHtml = false,
    camelizeKeys = true,
    resolveFiles = true,
    transformMetafields
  } = settings;
  if (!handle && !id) {
    return { data: null, error: "Either handle or id must be provided" };
  }
  const metafieldIdentifiers = customMetafields.length > 0 ? buildMetafieldIdentifiers(customMetafields) : "";
  const query = id ? getProductByIdQuery(metafieldIdentifiers) : getProductByHandleQuery(metafieldIdentifiers);
  const variables = id ? { id } : { handle, locale };
  try {
    const json = await fetchShopify(query, variables);
    if (json.errors?.length) {
      return {
        data: null,
        error: json.errors[0]?.message || "GraphQL error"
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
    const castedMetafields = customMetafields.length > 0 ? await castMetafields(
      rawMetafields,
      customMetafields,
      renderRichTextAsHtml,
      transformMetafields,
      resolveFiles,
      fetchShopify
    ) : rawMetafields;
    const metafields = camelizeKeys !== false ? camelizeMetafields(castedMetafields) : castedMetafields;
    let images = safeParseArray(node.images?.edges).map((edge) => ({
      originalSrc: edge.node.originalSrc,
      altText: edge.node.altText ?? null
    }));
    const variants = safeParseArray(node.variants?.edges).map(
      (edge) => {
        const variant = edge.node;
        return {
          id: variant.id,
          productTitle: variant.product?.title || node.title,
          variantTitle: variant.title === "Default Title" ? node.title : variant.title,
          price: {
            amount: parseFloat(variant.priceV2.amount),
            // number
            currencyCode: variant.priceV2.currencyCode
          },
          compareAtPrice: variant.compareAtPriceV2 ? {
            amount: parseFloat(variant.compareAtPriceV2.amount),
            currencyCode: variant.compareAtPriceV2?.currencyCode
          } : null
        };
      }
    );
    const defaultPrice = variants[0]?.price ? {
      amount: variants[0].price.amount,
      // number
      currencyCode: variants[0].price.currencyCode
    } : {
      amount: 0,
      currencyCode: "EUR"
    };
    const defaultCompareAtPrice = variants[0]?.compareAtPrice ? {
      amount: variants[0].compareAtPrice.amount,
      currencyCode: variants[0].compareAtPrice.currencyCode
    } : null;
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

// src/graphql/queries/getCollectionProducts.ts
function getCollectionProductsQuery(limit, metafieldIdentifiers, hasFilters) {
  return `
    query getCollectionProducts(
      $handle: String!,
      $cursor: String,
      ${hasFilters ? "$filters: [ProductFilter!]," : ""}
      $sortKey: ProductCollectionSortKeys,
      $reverse: Boolean
    ) {
      collection(handle: $handle) {
        id
        title
        handle
        products(
          first: ${limit},
          after: $cursor,
          sortKey: $sortKey,
          reverse: $reverse
          ${hasFilters ? "filters: $filters," : ""}
        ) {
          pageInfo {
            hasNextPage
            hasPreviousPage
            startCursor
            endCursor
          }
          filters {
            id
            label
            values {
              id
              label
              count
            }
          }
          edges {
            node {
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
                    priceV2 { amount currencyCode }
                    compareAtPriceV2 { amount currencyCode }
                    product { title handle }
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
      }
    }
  `;
}

// src/utils/formatAvailableFilters.ts
function formatAvailableFilters(rawFilters) {
  return rawFilters.map((group) => ({
    id: group.id,
    label: group.label,
    values: safeParseArray(group.values).map((value) => ({
      id: value.id,
      label: value.label,
      count: value.count
    }))
  }));
}

// src/products/getProducts.ts
async function getProducts(config) {
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
      camelizeKeys = true
    } = {}
  } = config;
  const metafieldIdentifiers = customMetafields.length > 0 ? buildMetafieldIdentifiers(customMetafields) : "";
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
    filters
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
          startCursor: null
        },
        error: "Collection or products not found"
      };
    }
    const edges = safeParseArray(collection.products.edges);
    const products = [];
    for (const edge of edges) {
      const node = edge.node;
      const rawMetafields = normalizeMetafields(
        node.metafields || [],
        customMetafields
      );
      const castedMetafields = customMetafields.length > 0 ? await castMetafields(
        rawMetafields,
        customMetafields,
        renderRichTextAsHtml,
        transformMetafields,
        resolveFiles,
        fetchShopify
      ) : rawMetafields;
      const metafields = camelizeKeys !== false ? camelizeMetafields(castedMetafields) : castedMetafields;
      const variants = safeParseArray(node.variants?.edges).map(
        (edge2) => {
          const variant = edge2.node;
          return {
            id: variant.id,
            productTitle: variant.product?.title || node.title,
            variantTitle: variant.title === "Default Title" ? node.title : variant.title,
            price: {
              amount: parseFloat(variant.priceV2.amount),
              // number
              currencyCode: variant.priceV2.currencyCode
            },
            compareAtPrice: variant.compareAtPriceV2 ? {
              amount: parseFloat(variant.compareAtPriceV2.amount),
              currencyCode: variant.compareAtPriceV2?.currencyCode
            } : null
          };
        }
      );
      const product = {
        id: node.id,
        title: node.title,
        handle: node.handle,
        descriptionHtml: node.descriptionHtml || "",
        featuredImage: node.featuredImage || null,
        images: safeParseArray(node.images?.edges).map((edge2) => edge2.node),
        variants,
        price: {
          amount: variants[0]?.price?.amount,
          currencyCode: variants[0]?.price?.currencyCode
        },
        compareAtPrice: variants[0]?.compareAtPrice ? {
          amount: variants[0].compareAtPrice.amount,
          currencyCode: variants[0].compareAtPrice.currencyCode
        } : null,
        metafields
      };
      products.push(product);
    }
    const pageInfo = collection.products.pageInfo;
    const rawFilters = collection.products.filters || [];
    const availableFilters = formatAvailableFilters(rawFilters);
    return { data: products, pageInfo, availableFilters, error: null };
  } catch (error) {
    return {
      data: [],
      pageInfo: {
        hasNextPage: false,
        hasPreviousPage: false,
        endCursor: null,
        startCursor: null
      },
      error: error instanceof Error ? error.message : "Unexpected error"
    };
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  getProduct,
  getProducts
});
//# sourceMappingURL=index.js.map