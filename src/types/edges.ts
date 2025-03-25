export interface ImageEdge {
  node: {
    originalSrc: string;
    altText: string | null;
  };
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
