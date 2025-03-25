import { fetchShopify } from "../graphql/client";
import { CustomMetafieldDefinition } from "../types/metafields";
import { getProduct } from "./getProduct";

// Mock the fetchShopify function
jest.mock("../graphql/client", () => ({
  fetchShopify: jest.fn(),
}));

// Dummy response simulating Shopify's response for a productByHandle query.
const dummyResponse = {
  data: {
    productByHandle: {
      id: "prod123",
      title: "Test Product",
      handle: "test-product",
      descriptionHtml: "<p>Test description</p>",
      featuredImage: {
        originalSrc: "https://example.com/image.jpg",
        altText: "Test Image",
      },
      images: {
        edges: [
          {
            node: {
              originalSrc: "https://example.com/image1.jpg",
              altText: "Image 1",
            },
          },
          {
            node: {
              originalSrc: "https://example.com/image2.jpg",
              altText: null,
            },
          },
        ],
      },
      variants: {
        edges: [
          {
            node: {
              id: "variant123",
              title: "Default Variant",
              priceV2: { amount: "99.99", currencyCode: "USD" },
              compareAtPriceV2: { amount: "149.99", currencyCode: "USD" },
              product: { title: "Test Product", handle: "test-product" },
            },
          },
        ],
      },
      metafields: [
        { key: "custom.stock", value: "42" },
        {
          key: "custom.rich",
          value:
            '{"type":"root","children":[{"type":"paragraph","children":[{"type":"text","value":"Rich text content"}]}]}',
        },
      ],
    },
  },
};

describe("getProduct", () => {
  beforeEach(() => {
    // Reset the mock before each test to avoid carryover effects.
    (fetchShopify as jest.Mock).mockReset();
  });

  it("should return a product with cast metafields", async () => {
    // Set up the mock to resolve with our dummy response.
    (fetchShopify as jest.Mock).mockResolvedValue(dummyResponse);

    const customMetafields: CustomMetafieldDefinition[] = [
      { field: "custom.stock", type: "integer" },
      { field: "custom.rich", type: "rich_text" },
    ];

    const options = {
      handle: "test-product",
      customMetafields,
      options: {
        renderRichTextAsHtml: true,
        includeRawMetafields: false,
        imageLimit: 10,
        variantLimit: 10,
        transformMetafields: undefined,
        locale: "en",
        returnFullResponse: false,
        resolveReferences: true,
      },
    };

    const result = await getProduct(options);
    expect(result.error).toBeNull();
    expect(result.data).toBeDefined();
    if (result.data) {
      expect(result.data.id).toBe("prod123");
      expect(result.data.title).toBe("Test Product");

      // Verify that "custom.stock" was converted to a number
      expect(result.data.metafields.custom.stock).toBe(42);

      // Verify that "custom.rich" was converted to HTML (contains a <p> tag)
      expect(result.data.metafields.custom.rich).toContain("<p>");
    }
  });

  it("should return error if neither id nor handle is provided", async () => {
    const options = {
      customMetafields: [],
      options: {
        renderRichTextAsHtml: false,
        includeRawMetafields: false,
        imageLimit: 10,
        variantLimit: 10,
        transformMetafields: undefined,
        locale: "en",
        returnFullResponse: false,
        resolveReferences: true,
      },
    };

    // Casting options to any since both id and handle are missing.
    const result = await getProduct(options as any);
    expect(result.error).toBe("Either handle or id must be provided");
    expect(result.data).toBeNull();
  });
});
