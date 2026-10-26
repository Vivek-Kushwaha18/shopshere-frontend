
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShoppingBag,
  ShieldCheck,
  Tag,
  ArrowRight,
  RefreshCw,
  Trash2,
  PackageCheck,
} from "lucide-react";

import CartItem from "@/components/cart/CartItem";
import {
  getCart,
  updateCartItem,
  removeCartItem,
  clearCart,
  type CartData,
} from "@/services/cart";

const BUY_NOW_STORAGE_KEY = "shopsphere-buy-now-checkout";

export default function CartPage() {
  const router = useRouter();

  const [cart, setCart] = useState<CartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [busy, setBusy] = useState(false);

  const loadCart = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getCart();
      setCart(response);
    } catch (err) {
      console.error("Failed to load cart:", err);
      setError("Unable to load your cart. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCart();
  }, [loadCart]);

  async function handleUpdateQuantity(
    itemId: number,
    quantity: number
  ) {
    if (quantity < 1 || busy) return;

    try {
      setBusy(true);
      setActionError("");

      await updateCartItem(itemId, quantity);
      await loadCart();
    } catch (err) {
      console.error("Failed to update quantity:", err);
      setActionError("Unable to update quantity. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove(itemId: number) {
    if (busy) return;

    try {
      setBusy(true);
      setActionError("");

      await removeCartItem(itemId);
      await loadCart();
    } catch (err) {
      console.error("Failed to remove cart item:", err);
      setActionError("Unable to remove this product. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function handleClearCart() {
    if (busy || !cart?.items.length) return;

    try {
      setBusy(true);
      setActionError("");

      await clearCart();
      await loadCart();
    } catch (err) {
      console.error("Failed to clear cart:", err);
      setActionError("Unable to clear your cart. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  // The cart page always displays every cart item.
  const allItems = cart?.items ?? [];

  const totalQuantity = allItems.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  const totalAmount = allItems.reduce(
    (sum, item) =>
      sum +
      Number(
        item.item_total ??
          Number(item.product.price) * item.quantity
      ),
    0
  );

  const formatPrice = (amount: number) =>
    `₹${amount.toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    })}`;

  // PLACE ORDER means checkout with all cart products.
  function handleCheckout() {
    if (!allItems.length || busy) return;

    try {
      sessionStorage.removeItem(BUY_NOW_STORAGE_KEY);

      router.push("/checkout");
    } catch (err) {
      console.error("Unable to continue to checkout:", err);
      setActionError(
        "Unable to continue to checkout. Please try again."
      );
    }
  }

  if (loading && cart === null) {
    return (
      <main className="relative min-h-screen overflow-hidden bg-[#f2f8ff] p-5 sm:p-8">
        <div className="water-orb water-orb-one" />
        <div className="water-orb water-orb-two" />

        <div className="relative mx-auto max-w-7xl animate-pulse space-y-6">
          <div className="h-20 rounded-2xl bg-white/80" />
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="h-96 rounded-3xl bg-white/80 lg:col-span-2" />
            <div className="h-96 rounded-3xl bg-white/80" />
          </div>
        </div>

        <style jsx>{`
          .water-orb {
            position: absolute;
            width: 300px;
            height: 300px;
            border-radius: 50%;
            filter: blur(80px);
            opacity: 0.4;
            pointer-events: none;
          }

          .water-orb-one {
            top: 0;
            left: -130px;
            background: #8ce4ff;
          }

          .water-orb-two {
            right: -130px;
            bottom: 0;
            background: #bdcaff;
          }
        `}</style>
      </main>
    );
  }

  if (error && cart === null) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f2f8ff] p-5">
        <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-xl">
          <RefreshCw
            size={38}
            className="mx-auto text-blue-600"
          />

          <h1 className="mt-4 text-xl font-bold text-slate-900">
            Unable to load your cart
          </h1>

          <p className="mt-2 text-sm text-slate-500">{error}</p>

          <button
            type="button"
            onClick={() => void loadCart()}
            className="mt-5 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </main>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-100 p-5">
        <div className="water-orb water-orb-one" />
        <div className="water-orb water-orb-two" />

        <div className="relative w-full max-w-lg rounded-3xl border border-white bg-white/85 p-10 text-center shadow-xl backdrop-blur-xl">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <ShoppingBag size={38} />
          </div>

          <h1 className="mt-5 text-2xl font-bold text-slate-900">
            Your cart is empty
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Find something you love and add it to your shopping cart.
          </p>

          <Link
            href="/products"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-6 py-3 font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:-translate-y-0.5"
          >
            Explore Products
            <ArrowRight size={17} />
          </Link>
        </div>

        <style jsx>{`
          .water-orb {
            position: absolute;
            width: 280px;
            height: 280px;
            border-radius: 50%;
            filter: blur(75px);
            opacity: 0.45;
            pointer-events: none;
          }

          .water-orb-one {
            top: 0;
            left: -100px;
            background: #8ce4ff;
          }

          .water-orb-two {
            right: -100px;
            bottom: 0;
            background: #b9c6ff;
          }
        `}</style>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#f0f9ff] via-[#f8faff] to-[#edf3ff]">
      <div className="water-orb water-orb-one" />
      <div className="water-orb water-orb-two" />
      <div className="water-orb water-orb-three" />

      <div className="relative mx-auto max-w-7xl px-3 py-6 sm:px-6 sm:py-9 lg:px-8">
        {error && (
          <p
            role="alert"
            className="mb-4 rounded-xl bg-white p-3 text-sm text-red-600 shadow-sm"
          >
            {error}
          </p>
        )}

        {actionError && (
          <p
            role="alert"
            className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {actionError}
          </p>
        )}

        <div className="grid items-start gap-6 lg:grid-cols-3">
          <section className="overflow-hidden rounded-3xl border border-white/90 bg-white/90 shadow-[0_18px_55px_rgba(40,83,140,0.09)] backdrop-blur-xl lg:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 px-4 py-4 sm:px-6">
              <div>
                <h1 className="text-lg font-bold text-slate-900 sm:text-xl">
                  My Shopping Cart
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                  {allItems.length}{" "}
                  {allItems.length === 1 ? "product" : "products"} · All products included
                </p>
              </div>

              <button
                type="button"
                onClick={() => void handleClearCart()}
                disabled={busy}
                className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-500 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
              >
                <Trash2 size={16} />
                Clear cart
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {allItems.map((item) => (
                <div
                  key={item.id}
                  className="relative bg-gradient-to-r from-blue-50/60 via-white to-cyan-50/30 p-4 sm:p-6"
                >
                  <div className="absolute bottom-5 left-0 top-5 w-1 rounded-r-full bg-blue-500" />

                  <div className="min-w-0">
                    <CartItem
                      item={item}
                      onUpdateQuantity={handleUpdateQuantity}
                      onRemove={handleRemove}
                      busy={busy}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-100 bg-gradient-to-r from-white to-blue-50/70 p-4 sm:p-6">
              <div className="flex justify-start">
                <Link
                  href="/products"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-blue-200 bg-white px-4 py-3 text-sm font-semibold text-blue-700 transition hover:border-blue-400 hover:bg-blue-50 sm:px-6"
                >
                  <ShoppingBag size={17} />
                  Continue Shopping
                </Link>
              </div>

              <p className="mt-3 text-center text-xs text-slate-500">
                All products in your cart are included in your order.
              </p>
            </div>
          </section>

          <aside className="overflow-hidden rounded-3xl border border-white/90 bg-white/95 shadow-[0_18px_55px_rgba(40,83,140,0.11)] backdrop-blur-xl lg:sticky lg:top-6">
            <div className="relative overflow-hidden bg-gradient-to-br from-blue-700 via-blue-600 to-cyan-500 px-6 py-6 text-white">
              <div className="summary-glow" />

              <div className="relative flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/20 bg-white/15">
                  <Tag size={21} />
                </div>

                <div>
                  <h2 className="text-lg font-bold">Price Details</h2>
                  <p className="mt-0.5 text-xs text-blue-100">
                    All cart products
                  </p>
                </div>
              </div>

              <div className="relative mt-6">
                <p className="text-sm text-blue-100">Total amount</p>
                <p className="mt-1 text-4xl font-bold tracking-tight">
                  {formatPrice(totalAmount)}
                </p>
              </div>
            </div>

            <div className="space-y-5 p-5 sm:p-6">
              <div className="flex justify-between gap-3 text-sm">
                <span className="text-slate-500">Products</span>
                <span className="font-semibold text-slate-900">
                  {allItems.length}
                </span>
              </div>

              <div className="flex justify-between gap-3 text-sm">
                <span className="text-slate-500">Total quantity</span>
                <span className="font-semibold text-slate-900">
                  {totalQuantity}
                </span>
              </div>

              <div className="flex justify-between gap-3 text-sm">
                <span className="text-slate-500">Product subtotal</span>
                <span className="font-semibold text-slate-900">
                  {formatPrice(totalAmount)}
                </span>
              </div>

              <div className="border-t border-dashed border-slate-200 pt-5">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold text-slate-800">
                    Total payable
                  </span>

                  <span className="text-xl font-bold text-blue-700">
                    {formatPrice(totalAmount)}
                  </span>
                </div>

                <p className="mt-2 text-xs leading-5 text-slate-400">
                  Delivery fees, discounts and final payment details are
                  confirmed at checkout.
                </p>
              </div>

              <button
                type="button"
                onClick={handleCheckout}
                disabled={!allItems.length || busy}
                className="group flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-400 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/20 transition hover:-translate-y-0.5 hover:shadow-orange-500/30 disabled:cursor-not-allowed disabled:opacity-40"
              >
                PLACE ORDER
                <ArrowRight
                  size={18}
                  className="transition-transform group-hover:translate-x-1"
                />
              </button>

              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/80 p-4">
                <div className="flex items-start gap-3">
                  <ShieldCheck
                    size={21}
                    className="shrink-0 text-emerald-600"
                  />

                  <div>
                    <p className="text-sm font-semibold text-emerald-800">
                      Secure checkout
                    </p>

                    <p className="mt-1 text-xs leading-5 text-emerald-700/80">
                      Your delivery and payment details are handled at checkout.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4">
                <PackageCheck
                  size={22}
                  className="shrink-0 text-blue-600"
                />

                <p className="text-xs leading-5 text-slate-500">
                  All products currently in your cart are included in your order.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <style jsx>{`
        .water-orb {
          position: absolute;
          z-index: 0;
          width: 320px;
          height: 320px;
          border-radius: 50%;
          filter: blur(85px);
          opacity: 0.3;
          pointer-events: none;
          animation: waterFlow 12s ease-in-out infinite alternate;
        }

        .water-orb-one {
          top: 5%;
          left: -170px;
          background: #75dcff;
        }

        .water-orb-two {
          top: 40%;
          right: -180px;
          background: #a9baff;
          animation-delay: -4s;
        }

        .water-orb-three {
          bottom: 0;
          left: 30%;
          width: 250px;
          height: 250px;
          background: #9cefe7;
          animation-delay: -7s;
        }

        .summary-glow {
          position: absolute;
          top: -100px;
          right: -90px;
          width: 220px;
          height: 220px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.12);
          filter: blur(20px);
          pointer-events: none;
        }

        @keyframes waterFlow {
          0% {
            transform: translate3d(0, 0, 0) scale(1);
          }

          50% {
            transform: translate3d(25px, -20px, 0) scale(1.08);
          }

          100% {
            transform: translate3d(-15px, 25px, 0) scale(0.96);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .water-orb {
            animation: none;
          }
        }
      `}</style>
    </main>
  );
}
