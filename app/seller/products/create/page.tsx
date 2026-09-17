"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { getStoredUser } from "@/services/auth";

import type { User } from "@/types/auth";

export default function HomePage() {
  const [user, setUser] =
    useState<User | null>(null);

  useEffect(() => {
    setUser(getStoredUser());
  }, []);

  return (
    <main>
      <section className="bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-20">
          <div className="max-w-3xl">
            <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
              Smart Shopping
            </p>

            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
              Welcome to ShopSphere
            </h1>

            <p className="mt-6 text-lg leading-8 text-gray-600">
              Discover products, explore categories,
              and enjoy a simple online shopping
              experience.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/products"
                className="rounded-lg bg-black px-6 py-3 font-medium text-white"
              >
                Browse Products
              </Link>

              {!user && (
                <>
                  <Link
                    href="/signup"
                    className="rounded-lg border bg-white px-6 py-3 font-medium"
                  >
                    Create Account
                  </Link>

                  <Link
                    href="/login"
                    className="rounded-lg border bg-white px-6 py-3 font-medium"
                  >
                    Login
                  </Link>
                </>
              )}

              {user?.role === "customer" && (
                <Link
                  href="/customer/dashboard"
                  className="rounded-lg border bg-white px-6 py-3 font-medium"
                >
                  Customer Dashboard
                </Link>
              )}

              {user?.role === "seller" && (
                <Link
                  href="/seller/dashboard"
                  className="rounded-lg border bg-white px-6 py-3 font-medium"
                >
                  Seller Dashboard
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-xl border p-6">
            <h2 className="text-xl font-semibold">
              Explore Products
            </h2>

            <p className="mt-3 text-gray-600">
              Browse products and filter them by
              category.
            </p>

            <Link
              href="/products"
              className="mt-5 inline-block font-medium hover:underline"
            >
              Browse →
            </Link>
          </div>

          <div className="rounded-xl border p-6">
            <h2 className="text-xl font-semibold">
              Smart Shopping
            </h2>

            <p className="mt-3 text-gray-600">
              AI-powered shopping assistance can be
              added as your platform grows.
            </p>
          </div>

          <div className="rounded-xl border p-6">
            <h2 className="text-xl font-semibold">
              Secure Account
            </h2>

            <p className="mt-3 text-gray-600">
              Manage your profile and password from
              your account.
            </p>

            <Link
              href={user ? "/profile" : "/login"}
              className="mt-5 inline-block font-medium hover:underline"
            >
              {user
                ? "View Profile →"
                : "Login →"}
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-16">
          <div className="grid gap-8 md:grid-cols-2">
            <div>
              <h2 className="text-3xl font-bold">
                For Customers
              </h2>

              <p className="mt-4 text-gray-600">
                Discover products and browse
                categories from one place.
              </p>

              <Link
                href="/products"
                className="mt-6 inline-block rounded-lg bg-black px-5 py-3 text-white"
              >
                Shop Now
              </Link>
            </div>

            <div>
              <h2 className="text-3xl font-bold">
                For Sellers
              </h2>

              <p className="mt-4 text-gray-600">
                Create products and manage your
                seller inventory.
              </p>

              <Link
                href={
                  user?.role === "seller"
                    ? "/seller/products"
                    : "/signup"
                }
                className="mt-6 inline-block rounded-lg border bg-white px-5 py-3"
              >
                {user?.role === "seller"
                  ? "Manage Products"
                  : "Become a Seller"}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}