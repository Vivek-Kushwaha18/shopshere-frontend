"use client";

import {
  FormEvent,
  useState,
} from "react";

import { updatePassword } from "@/services/auth";

export default function UpdatePasswordPage() {
  const [password, setPassword] =
    useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");

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

    if (
      password !== confirmPassword
    ) {
      setError(
        "Passwords do not match."
      );
      return;
    }

    if (password.length < 8) {
      setError(
        "Password must be at least 8 characters."
      );
      return;
    }

    const token =
      localStorage.getItem(
        "access_token"
      );

    if (!token) {
      setError(
        "Please login first."
      );
      return;
    }

    try {
      setLoading(true);

      const response =
        await updatePassword(
          token,
          {
            password,
          }
        );

      setMessage(
        response?.message ||
          "Password updated successfully."
      );

      setPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setError(
        err.message ||
          "Unable to update password."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow">
        <h1 className="text-2xl font-bold">
          Update Password
        </h1>

        {message && (
          <div className="mt-4 rounded-md bg-green-50 p-3 text-sm text-green-700">
            {message}
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="mt-6 space-y-4"
        >
          <input
            type="password"
            placeholder="New password"
            value={password}
            onChange={(e) =>
              setPassword(
                e.target.value
              )
            }
            required
            className="w-full rounded-md border px-3 py-2"
          />

          <input
            type="password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) =>
              setConfirmPassword(
                e.target.value
              )
            }
            required
            className="w-full rounded-md border px-3 py-2"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading
              ? "Updating..."
              : "Update Password"}
          </button>
        </form>
      </div>
    </div>
  );
}