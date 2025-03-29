export function getCollectionProductsQuery(
  limit: number,
  metafieldIdentifiers: string,
  hasFilters: boolean
): string {
  return `
    query getCollectionProducts(
      $handle: String!,
      $cursor: String,
      ${hasFilters ? "$filters: [ProductFilter!]," : ""}
      $sortKey: ProductCollectionSortKeys,
      $reverse: Boolean
    ) {
      collection(handle: $handle) {
        id
        title
        handle
        products(
          first: ${limit},
          after: $cursor,
          sortKey: $sortKey,
          reverse: $reverse
          ${hasFilters ? "filters: $filters," : ""}
        ) {
          pageInfo {
            hasNextPage
            hasPreviousPage
            startCursor
            endCursor
          }
          filters {
            id
            label
            values {
              id
              label
              count
            }
          }
          edges {
            node {
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
                    priceV2 { amount currencyCode }
                    compareAtPriceV2 { amount currencyCode }
                    product { title handle }
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
      }
    }
  `;
}
