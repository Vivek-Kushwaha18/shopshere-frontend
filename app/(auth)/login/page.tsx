"use client";

import {
  FormEvent,
  useState,
} from "react";
import Link from "next/link";
import {
  useRouter,
  useSearchParams,
} from "next/navigation";
import {
  login,
  getProfile,
} from "@/services/auth";

export default function LoginPage() {
  const router = useRouter();
  const searchParams =
    useSearchParams();

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  async function handleSubmit(
    e: FormEvent
  ) {
    e.preventDefault();

    setError("");

    try {
      setLoading(true);

      const response = await login({
        email,
        password,
      });

      if (!response.access_token) {
        throw new Error(
          "Access token was not returned by the server."
        );
      }

      localStorage.setItem(
        "access_token",
        response.access_token
      );

      if (response.refresh_token) {
        localStorage.setItem(
          "refresh_token",
          response.refresh_token
        );
      }

      /*
       * Get current user using /auth/me
       */

      const user = await getProfile(
        response.access_token
      );

      localStorage.setItem(
        "user",
        JSON.stringify(user)
      );

      /*
       * Role based redirect
       */

      if (user.role === "seller") {
        router.push(
          "/seller/dashboard"
        );
      } else {
        router.push(
          "/customer/dashboard"
        );
      }
    } catch (err: any) {
      setError(
        err.message || "Login failed."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        <h1 className="text-center text-3xl font-bold text-blue-600">
          ShopSphere
        </h1>

        <p className="mt-2 text-center text-gray-500">
          Login to your account
        </p>

        {searchParams.get(
          "registered"
        ) && (
          <div className="mt-5 rounded-md bg-green-50 p-3 text-sm text-green-700">
            Account created successfully.
            Please login.
          </div>
        )}

        {error && (
          <div className="mt-5 rounded-md bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="mt-6 space-y-5"
        >
          <div>
            <label className="mb-1 block text-sm font-medium">
              Email
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              required
              className="w-full rounded-md border px-3 py-2 outline-none focus:border-blue-500"
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Password
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              required
              className="w-full rounded-md border px-3 py-2 outline-none focus:border-blue-500"
              placeholder="Enter your password"
            />
          </div>

          <div className="flex justify-end">
            <Link
              href="/forgot-password"
              className="text-sm font-medium text-blue-600 hover:underline"
            >
              Forgot Password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading
              ? "Logging in..."
              : "Login"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Don't have an account?{" "}
          <Link
            href="/signup"
            className="font-semibold text-blue-600 hover:underline"
          >
            Signup
          </Link>
        </p>
      </div>
    </div>
  );
}