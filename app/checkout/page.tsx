"use client";

import { useState } from "react";
import { ArrowLeft, MapPin, Package } from "lucide-react";
import Link from "next/link";

export default function CheckoutPage() {
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    postalCode: "",
  });

  function handleChange(
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    console.log("Checkout address:", formData);
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      {/* Back to Cart */}
      <Link
        href="/cart"
        className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-black"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Cart
      </Link>

      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Checkout
        </h1>

        <p className="mt-2 text-gray-500">
          Complete your delivery information to continue.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Checkout Form */}
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
                  className="w-full rounded-lg border px-4 py-3 outline-none transition focus:border-black"
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
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Enter your phone number"
                  required
                  className="w-full rounded-lg border px-4 py-3 outline-none transition focus:border-black"
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
                  className="w-full resize-none rounded-lg border px-4 py-3 outline-none transition focus:border-black"
                />
              </div>

              {/* City + State */}
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
                    className="w-full rounded-lg border px-4 py-3 outline-none transition focus:border-black"
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
                    className="w-full rounded-lg border px-4 py-3 outline-none transition focus:border-black"
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
                  className="w-full rounded-lg border px-4 py-3 outline-none transition focus:border-black"
                />
              </div>

              {/* Continue Button */}
              <button
                type="submit"
                className="w-full rounded-lg bg-black px-5 py-3 font-semibold text-white transition hover:bg-gray-800"
              >
                Continue to Payment
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

            <div className="space-y-4 border-b pb-5">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">
                  Items
                </span>

                <span className="font-medium text-gray-900">
                  --
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-gray-500">
                  Shipping
                </span>

                <span className="font-medium text-gray-900">
                  --
                </span>
              </div>
            </div>

            <div className="flex justify-between pt-5">
              <span className="text-lg font-semibold">
                Total
              </span>

              <span className="text-lg font-bold">
                --
              </span>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}