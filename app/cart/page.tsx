"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import CartItem from "@/components/cart/CartItem";
import CartSummary from "@/components/cart/CartSummary";

import {
  getCart,
  updateCartItem,
  removeCartItem,
  clearCart,
  type CartData,
} from "@/services/cart";

export default function CartPage() {
  const [cart, setCart] = useState<CartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadCart() {
    try {
      setLoading(true);
      setError("");

      const response = await getCart();

      setCart(response);
    } catch (error) {
      console.error("Failed to load cart:", error);
      setError("Unable to load your cart.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let isMounted = true;

    async function loadInitialCart() {
      try {
        setLoading(true);
        setError("");

        const response = await getCart();

        if (!isMounted) {
          return;
        }

        setCart(response);
      } catch (error) {
        console.error("Failed to load cart:", error);

        if (!isMounted) {
          return;
        }

        setError("Unable to load your cart.");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadInitialCart();

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleUpdateQuantity(
    itemId: number,
    quantity: number
  ) {
    if (quantity < 1) {
      return;
    }

    try {
      await updateCartItem(itemId, quantity);
      await loadCart();
    } catch (error) {
      console.error(
        "Failed to update cart:",
        error
      );
    }
  }

  async function handleRemove(itemId: number) {
    try {
      await removeCartItem(itemId);
      await loadCart();
    } catch (error) {
      console.error(
        "Failed to remove cart item:",
        error
      );
    }
  }

  async function handleClearCart() {
    try {
      await clearCart();
      await loadCart();
    } catch (error) {
      console.error(
        "Failed to clear cart:",
        error
      );
    }
  }

  // =====================================================
  // ERROR
  // =====================================================

  if (error) {
    return (
      <main className="min-h-screen p-6">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-2xl font-bold">
            Your Cart
          </h1>

          <p className="mt-6 text-red-500">
            {error}
          </p>

          <button
            type="button"
            onClick={loadCart}
            className="mt-4 rounded-md bg-black px-5 py-2 text-white hover:bg-gray-800"
          >
            Try Again
          </button>
        </div>
      </main>
    );
  }

  // =====================================================
  // WAIT FOR CART API
  // =====================================================

  if (loading || cart === null) {
    return null;
  }

  // =====================================================
  // EMPTY CART
  // =====================================================

  if (cart.items.length === 0) {
    return (
      <main className="min-h-screen p-6">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-2xl font-bold">
            Your Cart
          </h1>

          <div className="mt-10 rounded-lg border p-10 text-center">
            <h2 className="text-xl font-semibold">
              Your cart is empty
            </h2>

            <p className="mt-2 text-gray-500">
              Add some products to your cart.
            </p>

            <Link
              href="/products"
              className="mt-6 inline-block rounded-md bg-black px-5 py-3 text-white hover:bg-gray-800"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // =====================================================
  // CART
  // =====================================================

  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto max-w-6xl">

        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">
            Your Cart
          </h1>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-3">

          <div className="space-y-4 lg:col-span-2">
            {cart.items.map((item) => (
              <CartItem
                key={item.id}
                item={item}
                onUpdateQuantity={
                  handleUpdateQuantity
                }
                onRemove={handleRemove}
              />
            ))}
          </div>

          <CartSummary
            totalItems={cart.total_items}
            total={cart.total}
            onClearCart={handleClearCart}
          />

        </div>
      </div>
    </main>
  );
}