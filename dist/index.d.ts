declare const PrimitiveTypes: readonly ["single_line_text", "multi_line_text", "rich_text", "integer", "decimal", "true_false", "json", "date", "date_and_time", "money", "rating", "url", "color", "id"];
declare const ReferenceTypes: readonly ["Product", "Product_variant", "Customer", "Company", "Page", "Collection", "File", "Metaobject"];
declare const UnitTypes: readonly ["weight", "dimension", "volume"];
type ShopifyCustomFieldType = (typeof PrimitiveTypes)[number] | (typeof ReferenceTypes)[number] | (typeof UnitTypes)[number];
interface CustomMetafieldDefinition {
    field: string;
    type: ShopifyCustomFieldType;
}
interface ResolvedMetafieldInfo {
    key: string;
    namespace: string;
    fullKey: string;
    type: ShopifyCustomFieldType;
}

interface Variant {
    id: string;
    variantTitle: string;
    productTitle: string;
    price: {
        amount: string;
        currencyCode: string;
    };
    compareAtPrice?: {
        amount: string;
        currencyCode: string;
    } | null;
}
interface Product {
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
    price: {
        amount: string;
        currencyCode: string;
    };
    compareAtPrice?: {
        amount: string;
        currencyCode: string;
    } | null;
    metafields: Record<string, any>;
}
interface FetchProductResult {
    data: Product | null;
    error: string | null;
    fullResponse?: unknown;
}

interface GetProductOptions {
    id?: string;
    handle?: string;
    customMetafields?: CustomMetafieldDefinition[];
    options: {
        locale?: string;
        resolveFiles?: boolean;
        renderRichTextAsHtml?: boolean;
        transformMetafields?: (raw: Record<string, Record<string, string>>, casted: Record<string, any>, definitions: ResolvedMetafieldInfo[]) => Record<string, any>;
    };
}
declare function getProduct(options: GetProductOptions): Promise<FetchProductResult>;

export { GetProductOptions, getProduct };
