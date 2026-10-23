
import { getStoredUser } from "./auth";

const RECENTLY_VIEWED_KEY = "shopsphere_recently_viewed_products";
const MAX_RECENT_PRODUCTS = 20;

/**
 * Get a separate storage key for each logged-in customer.
 * Guests and non-customer roles do not share customer history.
 */
function getRecentlyViewedStorageKey(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  const user = getStoredUser();

  if (!user || user.role !== "customer" || user.id == null) {
    return null;
  }

  return `${RECENTLY_VIEWED_KEY}_user_${user.id}`;
}

/**
 * Save a product ID for the currently logged-in customer.
 * The most recently viewed product appears first.
 */
export function recordViewedProduct(
  productId: number | string
): void {
  if (typeof window === "undefined") {
    return;
  }

  const storageKey = getRecentlyViewedStorageKey();

  if (!storageKey) {
    return;
  }

  const id = String(productId).trim();

  if (!id) {
    return;
  }

  try {
    const saved = window.localStorage.getItem(storageKey);
    const parsed: unknown = saved ? JSON.parse(saved) : [];

    const previousIds = Array.isArray(parsed)
      ? parsed.map(String)
      : [];

    const updatedIds = [
      id,
      ...previousIds.filter((savedId) => savedId !== id),
    ].slice(0, MAX_RECENT_PRODUCTS);

    window.localStorage.setItem(
      storageKey,
      JSON.stringify(updatedIds)
    );
  } catch (error) {
    console.error(
      "Unable to save recently viewed products:",
      error
    );
  }
}

/**
 * Return the current customer's recently viewed product IDs,
 * newest first.
 */
export function getRecentlyViewedProductIds(): string[] {
  if (typeof window === "undefined") {
    return [];
  }

  const storageKey = getRecentlyViewedStorageKey();

  if (!storageKey) {
    return [];
  }

  try {
    const saved = window.localStorage.getItem(storageKey);

    if (!saved) {
      return [];
    }

    const parsed: unknown = JSON.parse(saved);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map(String)
      .slice(0, MAX_RECENT_PRODUCTS);
  } catch (error) {
    console.error(
      "Unable to read recently viewed products:",
      error
    );

    return [];
  }
}
