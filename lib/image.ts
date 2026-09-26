import { API_URL } from "@/services/api";

export function getImageUrl(
  imageUrl?: string | null
): string {
  if (!imageUrl) {
    return "/images/product-placeholder.jpg";
  }

  // Already an absolute URL
  if (
    imageUrl.startsWith("http://") ||
    imageUrl.startsWith("https://")
  ) {
    return imageUrl;
  }

  const cleanPath =
    imageUrl.startsWith("/")
      ? imageUrl
      : `/${imageUrl}`;

  return `${API_URL}${cleanPath}`;
}