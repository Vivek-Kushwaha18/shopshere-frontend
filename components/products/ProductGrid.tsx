"use client";

import ProductCard, {
  Product,
} from "@/components/products/ProductCard";

const products: Product[] = [
  {
    id: 1,
    name: "Wireless Bluetooth Headphones",
    description:
      "High-quality wireless headphones with noise cancellation and long battery life.",
    price: 2499,
    originalPrice: 3999,
    image:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e",
    rating: 4.5,
    reviews: 128,
    category: "Electronics",
  },
  {
    id: 2,
    name: "Smart Watch Series 5",
    description:
      "Modern smartwatch with fitness tracking, notifications and health features.",
    price: 3499,
    originalPrice: 4999,
    image:
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30",
    rating: 4.4,
    reviews: 96,
    category: "Electronics",
  },
  {
    id: 3,
    name: "Classic Casual Sneakers",
    description:
      "Comfortable everyday sneakers designed for casual and active lifestyles.",
    price: 1999,
    originalPrice: 2999,
    image:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff",
    rating: 4.6,
    reviews: 214,
    category: "Fashion",
  },
  {
    id: 4,
    name: "Premium Backpack",
    description:
      "Durable backpack with multiple compartments for work, college and travel.",
    price: 1599,
    originalPrice: 2299,
    image:
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62",
    rating: 4.3,
    reviews: 87,
    category: "Fashion",
  },
  {
    id: 5,
    name: "Modern Table Lamp",
    description:
      "Elegant table lamp that adds a warm and modern touch to your room.",
    price: 1299,
    originalPrice: 1899,
    image:
      "https://images.unsplash.com/photo-1507473885765-e6ed057f782c",
    rating: 4.7,
    reviews: 63,
    category: "Home & Living",
  },
  {
    id: 6,
    name: "Skincare Essentials Kit",
    description:
      "Complete daily skincare set suitable for a simple and refreshing routine.",
    price: 899,
    originalPrice: 1299,
    image:
      "https://images.unsplash.com/photo-1556228720-195a672e8a03",
    rating: 4.5,
    reviews: 156,
    category: "Beauty",
  },
];

export default function ProductGrid() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
        />
      ))}
    </div>
  );
}