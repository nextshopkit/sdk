import { CustomMetafieldDefinition, ResolvedMetafieldInfo } from "./metafields";

export interface Variant {
  id: string;
  variantTitle: string;
  productTitle: string;
  price: { amount: number; currencyCode: string };
  compareAtPrice?: { amount: number; currencyCode: string } | null;
}

export interface VariantEdge {
  node: {
    id: string;
    title: string;
    priceV2: { amount: string; currencyCode: string };
    compareAtPriceV2?: { amount: string; currencyCode: string } | null;
    product: {
      title: string;
      handle: string;
    };
  };
}

export interface Product {
  id: string;
  title: string;
  handle: string;
  descriptionHtml: string;
  featuredImage: {
    originalSrc: string;
    altText: string | null;
  } | null;
  images: Array<{
    originalSrc: string;
    altText: string | null;
  }>;
  variants: Variant[];
  price: { amount: number; currencyCode: string };
  compareAtPrice?: { amount: number; currencyCode: string } | null;
  metafields: Record<string, any>; // instead of unknown
}

export interface FetchProductResult {
  data: Product | null;
  error: string | null;
  fullResponse?: unknown;
}

export interface GetProductOptions {
  id?: string;
  handle?: string;
  customMetafields?: CustomMetafieldDefinition[];
  options: {
    locale?: string;
    resolveFiles?: boolean;
    renderRichTextAsHtml?: boolean;
    camelizeKeys?: boolean;
    transformMetafields?: (
      raw: Record<string, Record<string, string>>,
      casted: Record<string, any>,
      definitions: ResolvedMetafieldInfo[]
    ) => Record<string, any>;
  };
}
