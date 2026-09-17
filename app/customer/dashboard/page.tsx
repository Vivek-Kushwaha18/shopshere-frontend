"use client";

import { useEffect, useState } from "react";
import {
  getProducts,
  // getImageUrl,
} from "@/services/product";
import type { Product } from "@/types/product";

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProducts() {
      try {
        const data = await getProducts();
        setProducts(data);
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Unable to load products"
        );
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
  }, []);

  if (loading) {
    return (
      <main className="p-6">
        Loading products...
      </main>
    );
  }

  if (error) {
    return (
      <main className="p-6">
        <p>{error}</p>
      </main>
    );
  }

  return (
    <main className="p-6">
      <h1 className="text-3xl font-bold mb-6">
        Products
      </h1>

      {products.length === 0 ? (
        <p>No products found.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {products.products.map((product) => {
            // const image = getImageUrl(
            //   product.image_url
            // );
            const image = null;

            return (
              <div
                key={product.id}
                className="rounded-lg border p-4"
              >
                {image && (
                  <img
                    src={image}
                    alt={product.name}
                    className="h-48 w-full rounded-md object-cover"
                  />
                )}

                <h2 className="mt-4 text-lg font-semibold">
                  {product.name}
                </h2>

                <p className="mt-2 text-sm">
                  {product.description}
                </p>

                <p className="mt-3 font-bold">
                  ₹{product.price}
                </p>

                <p className="mt-1 text-sm">
                  Stock: {product.quantity}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}