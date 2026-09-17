"use client";

import {
  FormEvent,
  useState,
} from "react";

import { forgotPassword } from "@/services/auth";

export default function ForgotPasswordPage() {
  const [email, setEmail] =
    useState("");

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  async function handleSubmit(
    e: FormEvent
  ) {
    e.preventDefault();

    setMessage("");
    setError("");

    try {
      setLoading(true);

      const response =
        await forgotPassword(email);

      setMessage(
        response?.message ||
          "Password reset instructions have been sent."
      );
    } catch (err: any) {
      setError(
        err.message ||
          "Unable to process your request."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow">
        <h1 className="text-center text-2xl font-bold">
          Forgot Password
        </h1>

        <p className="mt-2 text-center text-sm text-gray-500">
          Enter your email to continue.
        </p>

        {message && (
          <div className="mt-5 rounded-md bg-green-50 p-3 text-sm text-green-700">
            {message}
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
              placeholder="Enter your email"
              className="w-full rounded-md border px-3 py-2 outline-none focus:border-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading
              ? "Sending..."
              : "Send Reset Instructions"}
          </button>
        </form>
      </div>
    </div>
  );
}