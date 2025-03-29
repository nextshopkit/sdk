export type FetchShopify = (
  query: string,
  variables?: Record<string, any>
) => Promise<any>;
