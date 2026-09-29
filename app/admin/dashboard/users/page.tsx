"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Users,
  UserCheck,
  UserX,
  Trash2,
  Pencil,
} from "lucide-react";

import {
  activateUser,
  deactivateUser,
  deleteAdminUser,
  getAdminUsers,
  type AdminUser,
} from "@/services/adminUsers";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionUserId, setActionUserId] = useState<number | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<number | null>(null);

  useEffect(() => {
    async function loadUsers() {
      try {
        setLoading(true);
        setError("");

        const result = await getAdminUsers();

        if (!result.success) {
          throw new Error(
            result.data?.detail || "Unable to load users."
          );
        }

        setUsers(Array.isArray(result.data) ? result.data : []);
      } catch (error) {
        console.error("Admin users error:", error);

        setError(
          error instanceof Error
            ? error.message
            : "Unable to load users."
        );
      } finally {
        setLoading(false);
      }
    }

    loadUsers();
  }, []);

  async function handleStatusChange(user: AdminUser) {
    if (actionUserId !== null) {
      return;
    }

    const action = user.is_active ? "deactivate" : "activate";

    const confirmed = window.confirm(
      `Are you sure you want to ${action} "${user.full_name}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setActionUserId(user.id);
      setError("");

      const result = user.is_active
        ? await deactivateUser(user.id)
        : await activateUser(user.id);

      if (!result.success) {
        throw new Error(
          result.data?.detail || `Unable to ${action} user.`
        );
      }

      setUsers((currentUsers) =>
        currentUsers.map((currentUser) =>
          currentUser.id === user.id
            ? {
                ...currentUser,
                is_active: !user.is_active,
              }
            : currentUser
        )
      );
    } catch (error) {
      console.error("Admin user status error:", error);

      setError(
        error instanceof Error
          ? error.message
          : `Unable to ${action} user.`
      );
    } finally {
      setActionUserId(null);
    }
  }

  async function handleDelete(user: AdminUser) {
    if (deletingUserId !== null) {
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to permanently delete "${user.full_name}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingUserId(user.id);
      setError("");

      const result = await deleteAdminUser(user.id);

      if (!result.success) {
        throw new Error(
          result.data?.detail || "Unable to delete user."
        );
      }

      setUsers((currentUsers) =>
        currentUsers.filter(
          (currentUser) => currentUser.id !== user.id
        )
      );
    } catch (error) {
      console.error("Admin delete user error:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Unable to delete user."
      );
    } finally {
      setDeletingUserId(null);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10">
          <div className="flex min-h-[300px] items-center justify-center">
            <p className="text-gray-600">Loading users...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-7xl px-4 py-10">
        <Link
          href="/admin/dashboard"
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition hover:text-black"
        >
          <ArrowLeft className="h-4 w-4" />
          Dashboard
        </Link>

        <div className="mt-6">
          <p className="text-sm font-medium text-gray-500">
            ShopSphere Admin
          </p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight text-black">
            Users
          </h1>

          <p className="mt-1 text-sm text-gray-600">
            Manage customers, sellers and admins.
          </p>
        </div>

        {error && (
          <div className="mt-6 rounded-lg border border-black bg-white p-4 text-sm text-black">
            {error}
          </div>
        )}

        <div className="mt-6 rounded-lg border border-gray-200 bg-white px-5 py-4">
          <p className="text-sm text-gray-600">
            Total Users{" "}
            <span className="font-semibold text-black">
              {users.length}
            </span>
          </p>
        </div>

        {users.length === 0 ? (
          <div className="mt-6 rounded-xl border border-gray-200 bg-white p-12 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-gray-200 bg-gray-50">
              <Users className="h-8 w-8 text-gray-500" />
            </div>

            <h2 className="mt-5 text-xl font-semibold text-black">
              No users found
            </h2>

            <p className="mt-2 text-sm text-gray-600">
              There are currently no users to manage.
            </p>
          </div>
        ) : (
          <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px]">
                <thead className="border-b border-gray-200 bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-black">
                      User
                    </th>

                    <th className="px-6 py-4 text-left text-sm font-semibold text-black">
                      Email
                    </th>

                    <th className="px-6 py-4 text-left text-sm font-semibold text-black">
                      Role
                    </th>

                    <th className="px-6 py-4 text-left text-sm font-semibold text-black">
                      Status
                    </th>

                    <th className="px-6 py-4 text-right text-sm font-semibold text-black">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200">
                  {users.map((user) => {
                    const isActionLoading =
                      actionUserId === user.id;

                    const isDeleteLoading =
                      deletingUserId === user.id;

                    return (
                      <tr
                        key={user.id}
                        className="transition hover:bg-gray-50"
                      >
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-gray-200 bg-gray-50">
                              <Users className="h-5 w-5 text-gray-500" />
                            </div>

                            <div>
                              <p className="font-semibold text-black">
                                {user.full_name}
                              </p>

                              <p className="mt-1 text-xs text-gray-500">
                                ID: {user.id}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-5">
                          <p className="text-sm text-gray-600">
                            {user.email}
                          </p>

                          {user.is_verified && (
                            <p className="mt-1 text-xs text-gray-500">
                              Verified
                            </p>
                          )}
                        </td>

                        <td className="px-6 py-5">
                          <span className="inline-flex rounded-full border border-gray-300 bg-white px-3 py-1 text-xs font-medium capitalize text-black">
                            {user.role}
                          </span>
                        </td>

                        <td className="px-6 py-5">
                          {user.is_active ? (
                            <span className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-3 py-1 text-xs font-medium text-black">
                              <UserCheck className="h-3.5 w-3.5" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-2 rounded-full border border-black bg-black px-3 py-1 text-xs font-medium text-white">
                              <UserX className="h-3.5 w-3.5" />
                              Inactive
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-5">
                          <div className="flex items-center justify-end gap-2">
                            {/* Edit */}
                            <Link
                              href={`/admin/dashboard/users/${user.id}/edit`}
                              className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-black transition hover:border-black hover:bg-gray-50"
                            >
                              <Pencil className="h-4 w-4" />
                              Edit
                            </Link>

                            {/* Activate / Deactivate */}
                            <button
                              type="button"
                              onClick={() =>
                                handleStatusChange(user)
                              }
                              disabled={
                                isActionLoading ||
                                isDeleteLoading
                              }
                              className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-black transition hover:border-black hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {user.is_active ? (
                                <UserX className="h-4 w-4" />
                              ) : (
                                <UserCheck className="h-4 w-4" />
                              )}

                              {isActionLoading
                                ? "Updating..."
                                : user.is_active
                                ? "Deactivate"
                                : "Activate"}
                            </button>

                            {/* Delete */}
                            <button
                              type="button"
                              onClick={() =>
                                handleDelete(user)
                              }
                              disabled={
                                isDeleteLoading ||
                                isActionLoading
                              }
                              className="inline-flex items-center gap-2 rounded-md border border-black bg-white px-3 py-2 text-sm font-medium text-black transition hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <Trash2 className="h-4 w-4" />

                              {isDeleteLoading
                                ? "Deleting..."
                                : "Delete"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}