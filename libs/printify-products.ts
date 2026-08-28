// /api/products/[userId] paginates (Printify itself paginates at ~20-30 items
// per shop page), so a single fetch only ever returns the first page — this
// walks every page so pickers can show the artist's full catalog.
export async function fetchAllPrintifyProducts(userId: string, maxPages = 20): Promise<any[]> {
  const all: any[] = [];
  let page = 1;
  while (page <= maxPages) {
    const res = await fetch(`/api/products/${userId}?page=${page}&limit=100`);
    if (!res.ok) break;
    const data = await res.json();
    const products: any[] = Array.isArray(data) ? data : (data.products ?? []);
    all.push(...products);
    if (!data?.hasMore || products.length === 0) break;
    page += 1;
  }
  return all;
}
