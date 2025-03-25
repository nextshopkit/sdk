declare const PrimitiveTypes: readonly ["single_line_text", "multi_line_text", "integer", "decimal", "true_false", "json", "date", "date_and_time", "money", "rating", "url", "color", "id"];
declare const ReferenceTypes: readonly ["Product", "Product_variant", "Customer", "Company", "Page", "Collection", "File", "Metaobject"];
declare const UnitTypes: readonly ["weight", "dimension", "volume"];
type ShopifyCustomFieldType = (typeof PrimitiveTypes)[number] | (typeof ReferenceTypes)[number] | (typeof UnitTypes)[number];
interface CustomMetafieldDefinition {
    field: string;
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
    metafields: Record<string, unknown>;
}
interface FetchProductResult {
    data: Product | null;
    error: string | null;
}

interface GetProductOptions {
    id?: string;
    handle?: string;
    customMetafields?: CustomMetafieldDefinition[];
}
declare function getProduct(options: GetProductOptions): Promise<FetchProductResult>;

export { GetProductOptions, getProduct };
