const RECENTLY_VIEWED_KEY = "shopsphere_recently_viewed_products";
const MAX_RECENT_PRODUCTS = 20;

/** Save a product ID when its details page loads successfully. */
export function recordViewedProduct(productId: number | string): void {
  if (typeof window === "undefined") return;

  const id = String(productId).trim();
  if (!id) return;

  try {
    const saved = window.localStorage.getItem(RECENTLY_VIEWED_KEY);
    const parsed: unknown = saved ? JSON.parse(saved) : [];
    const previousIds = Array.isArray(parsed) ? parsed.map(String) : [];
    const updatedIds = [
      id,
      ...previousIds.filter((savedId) => savedId !== id),
    ].slice(0, MAX_RECENT_PRODUCTS);

    window.localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(updatedIds));
  } catch (error) {
    console.error("Unable to save recently viewed product:", error);
  }
}

/** Return recently viewed product IDs, newest first. */
export function getRecentlyViewedProductIds(): string[] {
  if (typeof window === "undefined") return [];

  try {
    const saved = window.localStorage.getItem(RECENTLY_VIEWED_KEY);
    const parsed: unknown = saved ? JSON.parse(saved) : [];
    if (!Array.isArray(parsed)) return [];

    return parsed.map(String).slice(0, MAX_RECENT_PRODUCTS);
  } catch (error) {
    console.error("Unable to read recently viewed products:", error);
    return [];
  }
}
