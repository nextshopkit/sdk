// src/utils/resolveShopifyFiles.ts
var FILES_QUERY = `
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
async function resolveShopifyFiles(fileIds, fetchShopify) {
  console.log("\u{1F9E9} Resolving Files", fileIds);
  const resultMap = {};
  if (fileIds.length === 0)
    return resultMap;
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
export {
  resolveShopifyFiles
};
//# sourceMappingURL=resolveShopifyFiles-4FVWNL22.mjs.map