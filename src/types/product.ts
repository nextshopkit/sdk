export interface Variant {
  id: string;
  variantTitle: string;
  productTitle: string;
  price: { amount: string; currencyCode: string };
  compareAtPrice?: { amount: string; currencyCode: string } | null;
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
  price: { amount: string; currencyCode: string };
  compareAtPrice?: { amount: string; currencyCode: string } | null;
  metafields: Record<string, unknown>;
}

export interface FetchProductResult {
  data: Product | null;
  error: string | null;
}
