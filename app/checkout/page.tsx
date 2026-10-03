"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, MapPin, Package } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";

import {
  getCart,
  clearCart,
  type CartData,
} from "@/services/cart";

import {
  createOrder,
} from "@/services/orders";

export default function CheckoutPage() {
  const router = useRouter();

  const [cart, setCart] = useState<CartData | null>(null);
  const [loadingCart, setLoadingCart] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    postalCode: "",
  });

  async function loadCart() {
    try {
      setLoadingCart(true);

      const response = await getCart();

      setCart(response);
    } catch (error) {
      console.error("Failed to load cart:", error);

      Swal.fire({
        icon: "error",
        title: "Unable to load cart",
        text:
          error instanceof Error
            ? error.message
            : "Please try again.",
      });
    } finally {
      setLoadingCart(false);
    }
  }

  useEffect(() => {
    loadCart();
  }, []);

  function handleChange(
    event: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement
    >
  ) {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!cart || cart.items.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "Your cart is empty",
        text: "Please add products before placing an order.",
      });

      return;
    }

    try {
      setPlacingOrder(true);

      const shippingAddress = [
        `Name: ${formData.fullName}`,
        `Phone: ${formData.phone}`,
        `Address: ${formData.address}`,
        `City: ${formData.city}`,
        `State: ${formData.state}`,
        `Postal Code: ${formData.postalCode}`,
      ].join("\n");

      const order = await createOrder({
        shipping_address: shippingAddress,
        items: cart.items.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
        })),
      });

      await clearCart();

      await Swal.fire({
        icon: "success",
        title: "Order Placed Successfully",
        text: `Your order #${order.id} has been placed successfully.`,
        confirmButtonText: "View Orders",
      });

      router.push("/orders");
    } catch (error) {
      console.error("Failed to place order:", error);

      Swal.fire({
        icon: "error",
        title: "Unable to place order",
        text:
          error instanceof Error
            ? error.message
            : "Something went wrong while placing your order.",
      });
    } finally {
      setPlacingOrder(false);
    }
  }

  if (loadingCart) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-10">
        <div className="rounded-xl border bg-white p-10 text-center">
          <p className="text-gray-500">
            Loading checkout...
          </p>
        </div>
      </main>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-10">
        <Link
          href="/cart"
          className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-black"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Cart
        </Link>

        <div className="rounded-xl border bg-white p-10 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900">
            Your cart is empty
          </h1>

          <p className="mt-2 text-gray-500">
            Add products to your cart before checkout.
          </p>

          <Link
            href="/products"
            className="mt-6 inline-block rounded-lg bg-black px-5 py-3 font-semibold text-white hover:bg-gray-800"
          >
            Continue Shopping
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      <Link
        href="/cart"
        className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-black"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Cart
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Checkout
        </h1>

        <p className="mt-2 text-gray-500">
          Enter your delivery information to place your order.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Delivery Address */}
        <section className="lg:col-span-2">
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black text-white">
                <MapPin className="h-5 w-5" />
              </div>

              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Delivery Address
                </h2>

                <p className="text-sm text-gray-500">
                  Enter the address where you want your order delivered.
                </p>
              </div>
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-5"
            >
              {/* Full Name */}
              <div>
                <label
                  htmlFor="fullName"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Full Name
                </label>

                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  required
                  disabled={placingOrder}
                  className="w-full rounded-lg border px-4 py-3 outline-none transition focus:border-black disabled:bg-gray-100"
                />
              </div>

              {/* Phone */}
              <div>
                <label
                  htmlFor="phone"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Phone Number
                </label>

                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  inputMode="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Enter your phone number"
                  required
                  disabled={placingOrder}
                  className="w-full rounded-lg border px-4 py-3 outline-none transition focus:border-black disabled:bg-gray-100"
                />
              </div>

              {/* Address */}
              <div>
                <label
                  htmlFor="address"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Address
                </label>

                <textarea
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="House number, street, area"
                  rows={4}
                  required
                  disabled={placingOrder}
                  className="w-full resize-none rounded-lg border px-4 py-3 outline-none transition focus:border-black disabled:bg-gray-100"
                />
              </div>

              {/* City and State */}
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="city"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    City
                  </label>

                  <input
                    id="city"
                    name="city"
                    type="text"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="Enter city"
                    required
                    disabled={placingOrder}
                    className="w-full rounded-lg border px-4 py-3 outline-none transition focus:border-black disabled:bg-gray-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="state"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    State
                  </label>

                  <input
                    id="state"
                    name="state"
                    type="text"
                    value={formData.state}
                    onChange={handleChange}
                    placeholder="Enter state"
                    required
                    disabled={placingOrder}
                    className="w-full rounded-lg border px-4 py-3 outline-none transition focus:border-black disabled:bg-gray-100"
                  />
                </div>
              </div>

              {/* Postal Code */}
              <div>
                <label
                  htmlFor="postalCode"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Postal Code
                </label>

                <input
                  id="postalCode"
                  name="postalCode"
                  type="text"
                  inputMode="numeric"
                  value={formData.postalCode}
                  onChange={handleChange}
                  placeholder="Enter postal code"
                  required
                  disabled={placingOrder}
                  className="w-full rounded-lg border px-4 py-3 outline-none transition focus:border-black disabled:bg-gray-100"
                />
              </div>

              {/* Place Order */}
              <button
                type="submit"
                disabled={placingOrder}
                className="w-full rounded-lg bg-black px-5 py-3 font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {placingOrder
                  ? "Placing Order..."
                  : "Place Order"}
              </button>
            </form>
          </div>
        </section>

        {/* Order Summary */}
        <aside>
          <div className="sticky top-6 rounded-xl border bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <Package className="h-5 w-5 text-gray-700" />

              <h2 className="text-xl font-semibold text-gray-900">
                Order Summary
              </h2>
            </div>

            {/* Products */}
            <div className="space-y-4 border-b pb-5">
              {cart.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3"
                >
                  {item.product.image_url ? (
                    <img
                      src={item.product.image_url}
                      alt={item.product.name}
                      className="h-14 w-14 shrink-0 rounded-md border object-cover"
                    />
                  ) : (
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md border bg-gray-100 text-xs text-gray-500">
                      No image
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900">
                      {item.product.name}
                    </p>

                    <p className="text-xs text-gray-500">
                      Qty: {item.quantity}
                    </p>

                    <p className="text-xs text-gray-500">
                      ₹{item.product.price.toFixed(2)} each
                    </p>
                  </div>

                  <p className="text-sm font-medium text-gray-900">
                    ₹{item.item_total.toFixed(2)}
                  </p>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="space-y-4 border-b py-5">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">
                  Items
                </span>

                <span className="font-medium text-gray-900">
                  {cart.total_items}
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-gray-500">
                  Shipping
                </span>

                <span className="font-medium text-gray-900">
                  Free
                </span>
              </div>
            </div>

            {/* Total */}
            <div className="flex justify-between pt-5">
              <span className="text-lg font-semibold">
                Total
              </span>

              <span className="text-lg font-bold">
                ₹{cart.total.toFixed(2)}
              </span>
            </div>

            {/* Payment Status */}
            <div className="mt-5 rounded-lg bg-gray-50 p-3">
              <p className="text-xs text-gray-500">
                Payment
              </p>

              <p className="mt-1 text-sm font-medium text-gray-900">
                Payment not required
              </p>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}