import { CustomMetafieldDefinition, ResolvedMetafieldInfo } from "./metafields";
import type { Product } from "./product";

// Pagination info
export interface ProductsPageInfo {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  endCursor: string | null;
  startCursor: string | null;
}

// Optional filtering support (if collection filtering is enabled)
export interface FilterValue {
  id: string;
  label: string;
  count: number;
}

export interface FilterGroup {
  id: string;
  label: string;
  values: FilterValue[];
}

// Result returned from getProducts
export interface FetchProductsResult {
  data: Product[];
  pageInfo: ProductsPageInfo;
  availableFilters?: FilterGroup[]; // Only if collection filters are enabled
  error: string | null;
}

// types/products.ts

export type ProductFilter =
  | {
      available?: boolean;
    }
  | {
      variantOption?: {
        name: string;
        value: string;
      };
    }
  | {
      productMetafield: {
        namespace: string;
        key: string;
        value: string;
      };
    }
  | {
      productTag: string;
    }
  | {
      productType: string;
    }
  | {
      collection?: string;
    }
  | {
      price: {
        min?: number;
        max?: number;
      };
    };

type ProductSortKey =
  | "TITLE"
  | "PRICE"
  | "BEST_SELLING"
  | "CREATED"
  | "ID"
  | "MANUAL"
  | "RELEVANCE";

export interface GetProductsOptions {
  collectionHandle: string;
  limit?: number;
  cursor?: string;
  reverse?: boolean;
  sortKey?: ProductSortKey;
  filters?: ProductFilter[];
  customMetafields?: CustomMetafieldDefinition[];
  options?: {
    resolveFiles?: boolean;
    renderRichTextAsHtml?: boolean;
    transformMetafields?: (
      raw: Record<string, Record<string, string>>,
      casted: Record<string, any>,
      definitions: ResolvedMetafieldInfo[]
    ) => Record<string, any> | Promise<Record<string, any>>;
    camelizeKeys?: boolean;
  };
}
