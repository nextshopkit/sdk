const FILES_QUERY = `
    query getFiles($ids: [ID!]!) {
    nodes(ids: $ids) {
        ... on GenericFile {
        id
        url
        mimeType
        alt
        originalFileSize
        previewImage {
            id
            url
        }
        }
    }
    }
`;

export async function resolveShopifyFiles(
  fileIds: string[],
  fetchShopify: (query: string, variables?: Record<string, any>) => Promise<any>
): Promise<Record<string, any>> {
  console.log("🧩 Resolving Files", fileIds);

  const resultMap: Record<string, any> = {};
  if (fileIds.length === 0) return resultMap;

  try {
    const res = await fetchShopify(FILES_QUERY, { ids: fileIds });
    const nodes = res.data?.nodes || [];

    for (const file of nodes) {
      if (file?.id) {
        resultMap[file.id] = file;
      }
    }

    return resultMap;
  } catch (err) {
    console.error("Error resolving files:", err);
    return resultMap;
  }
}
