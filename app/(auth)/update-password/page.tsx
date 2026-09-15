
"use client";

import Link from "next/link";
import {
  FormEvent,
  Suspense,
  useState,
} from "react";
import {
  useRouter,
  useSearchParams,
} from "next/navigation";
import { updatePassword } from "@/services/auth";

function UpdatePasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const tokenFromUrl =
    searchParams.get("token") || "";

  const [token, setToken] =
    useState(tokenFromUrl);

  const [newPassword, setNewPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!token) {
      setError("Reset token is required.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const result = await updatePassword({
        token: token,
        new_password: newPassword,
      });

      console.log(
        "Update password response:",
        result
      );

      setSuccess(
        "Password updated successfully. Redirecting to login..."
      );

      setTimeout(() => {
        router.push("/login");
      }, 1500);
    } catch (error) {
      console.error(
        "Update password error:",
        error
      );

      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError(
          "Unable to update password."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-128px)] items-center justify-center bg-gray-50 px-6 py-12">
      <div className="w-full max-w-md rounded-2xl border bg-white p-8 shadow-sm">

        {/* Heading */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold">
            Reset Password
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Create your new password
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Success */}
        {success && (
          <div className="mb-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-600">
            {success}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >

          {/* Token */}
          <div>
            <label
              htmlFor="token"
              className="mb-2 block text-sm font-medium"
            >
              Reset Token
            </label>

            <input
              id="token"
              type="text"
              value={token}
              onChange={(e) =>
                setToken(e.target.value)
              }
              placeholder="Enter reset token"
              required
              disabled={loading}
              className="w-full rounded-lg border px-4 py-3 outline-none focus:border-black disabled:bg-gray-100"
            />
          </div>

          {/* New Password */}
          <div>
            <label
              htmlFor="newPassword"
              className="mb-2 block text-sm font-medium"
            >
              New Password
            </label>

            <div className="relative">
              <input
                id="newPassword"
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                value={newPassword}
                onChange={(e) =>
                  setNewPassword(
                    e.target.value
                  )
                }
                placeholder="Enter new password"
                required
                disabled={loading}
                className="w-full rounded-lg border px-4 py-3 pr-20 outline-none focus:border-black disabled:bg-gray-100"
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword(
                    !showPassword
                  )
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500"
              >
                {showPassword
                  ? "Hide"
                  : "Show"}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label
              htmlFor="confirmPassword"
              className="mb-2 block text-sm font-medium"
            >
              Confirm Password
            </label>

            <div className="relative">
              <input
                id="confirmPassword"
                type={
                  showConfirmPassword
                    ? "text"
                    : "password"
                }
                value={confirmPassword}
                onChange={(e) =>
                  setConfirmPassword(
                    e.target.value
                  )
                }
                placeholder="Confirm new password"
                required
                disabled={loading}
                className="w-full rounded-lg border px-4 py-3 pr-20 outline-none focus:border-black disabled:bg-gray-100"
              />

              <button
                type="button"
                onClick={() =>
                  setShowConfirmPassword(
                    !showConfirmPassword
                  )
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500"
              >
                {showConfirmPassword
                  ? "Hide"
                  : "Show"}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-black py-3 font-medium text-white hover:bg-gray-800 disabled:opacity-60"
          >
            {loading
              ? "Updating..."
              : "Update Password"}
          </button>
        </form>

        {/* Login */}
        <p className="mt-6 text-center text-sm text-gray-600">
          Remember your password?{" "}

          <Link
            href="/login"
            className="font-semibold text-black hover:underline"
          >
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function UpdatePasswordPage() {
  return (
    <Suspense fallback={null}>
      <UpdatePasswordForm />
    </Suspense>
  );
}
