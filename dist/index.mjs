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
function normalizeMetafields(metafields) {
  const result = {};
  for (const field of metafields) {
    if (!field?.key)
      continue;
    const [namespace, key] = field.key.includes(".") ? field.key.split(".") : ["global", field.key];
    if (!result[namespace]) {
      result[namespace] = {};
    }
    result[namespace][key] = field.value;
  }
  return result;
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
      return rawValue;
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
function castMetafields(normalizedMetafields, definitions, renderRichTextAsHtml, transformMetafields) {
  const result = {};
  const resolvedDefs = [];
  for (const def of definitions) {
    const [namespace, key] = def.field.split(".");
    const rawValue = normalizedMetafields?.[namespace]?.[key];
    resolvedDefs.push({
      namespace,
      key,
      fullKey: def.field,
      type: def.type
    });
    if (rawValue !== void 0) {
      result[namespace] = result[namespace] || {};
      if (def.type === "rich_text" && renderRichTextAsHtml) {
        result[namespace][key] = renderRichText(rawValue);
      } else {
        result[namespace][key] = castMetafieldValue(rawValue, def.type);
      }
    }
  }
  if (transformMetafields) {
    return transformMetafields(normalizedMetafields, result, resolvedDefs);
  }
  return result;
}

// src/products/getProduct.ts
async function getProduct(options) {
  const { handle, id, customMetafields = [], options: settings } = options;
  const {
    renderRichTextAsHtml = false,
    includeRawMetafields = false,
    imageLimit,
    variantLimit,
    transformMetafields,
    locale,
    returnFullResponse,
    resolveReferences
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
    const rawMetafields = normalizeMetafields(node.metafields || []);
    const metafields = customMetafields.length > 0 ? castMetafields(
      rawMetafields,
      customMetafields,
      renderRichTextAsHtml,
      transformMetafields
    ) : rawMetafields;
    let images = (node.images.edges ?? []).map((edge) => ({
      originalSrc: edge.node.originalSrc,
      altText: edge.node.altText ?? null
    }));
    if (imageLimit && images.length > imageLimit) {
      images = images.slice(0, imageLimit);
    }
    let variants = (node.variants.edges ?? []).map((edge) => {
      const variant = edge.node;
      return {
        id: variant.id,
        variantTitle: variant.title,
        productTitle: variant.product?.title || node.title,
        price: variant.priceV2,
        compareAtPrice: variant.compareAtPriceV2 ?? null
      };
    });
    if (variantLimit && variants.length > variantLimit) {
      variants = variants.slice(0, variantLimit);
    }
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
    const fullResponse = includeRawMetafields ? json : void 0;
    return { data: product, error: null, fullResponse };
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