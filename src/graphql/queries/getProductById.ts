export const getProductByIdQuery = (metafieldIdentifiers: string) => `
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
