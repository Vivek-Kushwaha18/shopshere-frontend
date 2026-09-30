"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";

import {
  getAdminUser,
  updateAdminUser,
  type AdminUser,
} from "@/services/adminUsers";

export default function EditAdminUserPage() {
  const params = useParams();
  const router = useRouter();

  const userId = Number(params.id);

  const [user, setUser] = useState<AdminUser | null>(null);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState<
    AdminUser["gender"]
  >(null);
  const [role, setRole] = useState<AdminUser["role"]>("customer");
  const [isActive, setIsActive] = useState(true);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadUser() {
      if (!Number.isInteger(userId) || userId <= 0) {
        setError("Invalid user ID.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const result = await getAdminUser(userId);

        if (!result.success) {
          throw new Error(
            result.data?.detail || "Unable to load user."
          );
        }

        const userData = result.data as AdminUser;

        setUser(userData);
        setFullName(userData.full_name);
        setPhone(userData.phone || "");
        setGender(userData.gender);
        setRole(userData.role);
        setIsActive(userData.is_active);
      } catch (error) {
        console.error("Load admin user error:", error);

        setError(
          error instanceof Error
            ? error.message
            : "Unable to load user."
        );
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, [userId]);

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!user) {
      return;
    }

    if (fullName.trim().length < 2) {
      setError("Full name must contain at least 2 characters.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const result = await updateAdminUser(user.id, {
        full_name: fullName.trim(),
        phone: phone.trim() || null,
        gender,
        role,
        is_active: isActive,
      });

      if (!result.success) {
        throw new Error(
          result.data?.detail || "Unable to update user."
        );
      }

      router.push("/admin/dashboard/users");
      router.refresh();
    } catch (error) {
      console.error("Update admin user error:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Unable to update user."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-white">
        <div className="mx-auto max-w-4xl px-4 py-10">
          <div className="flex min-h-[300px] items-center justify-center">
            <p className="text-gray-600">
              Loading user...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-white">
        <div className="mx-auto max-w-4xl px-4 py-10">
          <Link
            href="/admin/dashboard/users"
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition hover:text-black"
          >
            <ArrowLeft className="h-4 w-4" />
            Users
          </Link>

          <div className="mt-8 rounded-xl border border-gray-200 p-8">
            <h1 className="text-xl font-semibold text-black">
              Unable to load user
            </h1>

            <p className="mt-2 text-sm text-gray-600">
              {error || "User not found."}
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-4xl px-4 py-10">
        <Link
          href="/admin/dashboard/users"
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition hover:text-black"
        >
          <ArrowLeft className="h-4 w-4" />
          Users
        </Link>

        {error && (
          <div className="mt-6 rounded-lg border border-black bg-white p-4 text-sm text-black">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="mt-8 rounded-xl border border-gray-200 bg-white p-6 sm:p-8"
        >
          <div className="grid gap-6 sm:grid-cols-2">
            {/* Full Name */}
            <div className="sm:col-span-2">
              <label
                htmlFor="full_name"
                className="mb-2 block text-sm font-medium text-black"
              >
                Full Name
              </label>

              <input
                id="full_name"
                type="text"
                value={fullName}
                onChange={(event) =>
                  setFullName(event.target.value)
                }
                required
                minLength={2}
                maxLength={100}
                className="w-full rounded-md border border-gray-300 px-4 py-3 text-sm text-black outline-none transition focus:border-black"
              />
            </div>

            {/* Email */}
            <div className="sm:col-span-2">
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-black"
              >
                Email
              </label>

              <input
                id="email"
                type="email"
                value={user.email}
                disabled
                className="w-full rounded-md border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-500"
              />

              <p className="mt-2 text-xs text-gray-500">
                Email cannot be changed from Admin User Edit.
              </p>
            </div>

            {/* Phone */}
            <div>
              <label
                htmlFor="phone"
                className="mb-2 block text-sm font-medium text-black"
              >
                Phone
              </label>

              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(event) =>
                  setPhone(event.target.value)
                }
                maxLength={20}
                className="w-full rounded-md border border-gray-300 px-4 py-3 text-sm text-black outline-none transition focus:border-black"
              />
            </div>

            {/* Gender */}
            <div>
              <label
                htmlFor="gender"
                className="mb-2 block text-sm font-medium text-black"
              >
                Gender
              </label>

              <select
                id="gender"
                value={gender || ""}
                onChange={(event) =>
                  setGender(
                    event.target.value
                      ? (event.target.value as AdminUser["gender"])
                      : null
                  )
                }
                className="w-full rounded-md border border-gray-300 bg-white px-4 py-3 text-sm text-black outline-none transition focus:border-black"
              >
                <option value="">
                  Not specified
                </option>
                <option value="male">
                  Male
                </option>
                <option value="female">
                  Female
                </option>
                <option value="other">
                  Other
                </option>
                <option value="prefer_not_to_say">
                  Prefer not to say
                </option>
              </select>
            </div>

            {/* Role */}
            <div>
              <label
                htmlFor="role"
                className="mb-2 block text-sm font-medium text-black"
              >
                Role
              </label>

              <select
                id="role"
                value={role}
                onChange={(event) =>
                  setRole(
                    event.target.value as AdminUser["role"]
                  )
                }
                className="w-full rounded-md border border-gray-300 bg-white px-4 py-3 text-sm text-black outline-none transition focus:border-black"
              >
                <option value="customer">
                  Customer
                </option>

                <option value="seller">
                  Seller
                </option>

                <option value="admin">
                  Admin
                </option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label
                htmlFor="status"
                className="mb-2 block text-sm font-medium text-black"
              >
                Account Status
              </label>

              <select
                id="status"
                value={isActive ? "active" : "inactive"}
                onChange={(event) =>
                  setIsActive(
                    event.target.value === "active"
                  )
                }
                className="w-full rounded-md border border-gray-300 bg-white px-4 py-3 text-sm text-black outline-none transition focus:border-black"
              >
                <option value="active">
                  Active
                </option>

                <option value="inactive">
                  Inactive
                </option>
              </select>
            </div>
          </div>

          {/* Account information */}
          <div className="mt-8 rounded-lg border border-gray-200 bg-gray-50 p-4">
            <p className="text-sm font-medium text-black">
              Account Information
            </p>

            <div className="mt-3 grid gap-2 text-sm text-gray-600 sm:grid-cols-2">
              <p>
                User ID:{" "}
                <span className="font-medium text-black">
                  {user.id}
                </span>
              </p>

              <p>
                Email Verified:{" "}
                <span className="font-medium text-black">
                  {user.is_verified
                    ? "Yes"
                    : "No"}
                </span>
              </p>
            </div>
          </div>

          {/* Buttons */}
          <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Link
              href="/admin/dashboard/users"
              className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-5 py-3 text-sm font-medium text-black transition hover:border-black hover:bg-gray-50"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-black px-5 py-3 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Save className="h-4 w-4" />

              {saving
                ? "Saving..."
                : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}