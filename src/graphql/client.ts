const SHOPIFY_GRAPHQL_URL = process.env.SHOPIFY_GRAPHQL_URL!;
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN!;
const REQUIRED_API_VERSION = "2025-01";

export async function fetchShopify<T = any>(
  query: string,
  variables: Record<string, any> = {}
): Promise<T> {
  if (!SHOPIFY_GRAPHQL_URL || !SHOPIFY_ACCESS_TOKEN) {
    throw new Error("Missing Shopify API credentials");
  }

  // 🛡️ Optional: Warn if API version isn't correct
  const versionMatch = SHOPIFY_GRAPHQL_URL.match(
    /\/api\/([\d-]+)\/graphql\.json/
  );
  const currentVersion = versionMatch?.[1];

  if (currentVersion && currentVersion !== REQUIRED_API_VERSION) {
    console.warn(
      `⚠️ Shopify Storefront API version "${currentVersion}" detected. This SDK requires "${REQUIRED_API_VERSION}" for full compatibility. Some features may not work as expected.`
    );
  }

  const res = await fetch(SHOPIFY_GRAPHQL_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": SHOPIFY_ACCESS_TOKEN,
    },
    body: JSON.stringify({ query, variables }),
  });

  const json = await res.json();

  if (json.errors) {
    throw new Error(json.errors[0]?.message || "GraphQL error");
  }

  return json;
}
