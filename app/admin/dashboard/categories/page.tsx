"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import Link from "next/link";

import {
  ArrowLeft,
  Edit,
  FolderTree,
  Plus,
  Trash2,
  X,
} from "lucide-react";

import {
  createCategory,
  deleteCategory,
  deactivateCategory,
  getAdminCategories,
  updateCategory,
  activateCategory,
  type Category,
} from "@/services/categories";

export default function AdminCategoriesPage() {
  const [categories, setCategories] =
    useState<Category[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [statusUpdatingId, setStatusUpdatingId] =
    useState<number | null>(null);

  const [deletingId, setDeletingId] =
    useState<number | null>(null);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [showForm, setShowForm] =
    useState(false);

  const [editingId, setEditingId] =
    useState<number | null>(null);

  const [name, setName] =
    useState("");

  const [description, setDescription] =
    useState("");

  // =====================================================
  // LOAD ALL CATEGORIES
  //
  // IMPORTANT:
  // Use getAdminCategories(), NOT getCategories().
  // This keeps inactive categories after refresh.
  // =====================================================

  async function loadCategories() {
    try {
      setLoading(true);
      setError("");

      const result =
        await getAdminCategories();

      console.log(
        "ADMIN CATEGORIES:",
        result
      );

      setCategories(result);
    } catch (error) {
      console.error(
        "Admin categories error:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Unable to load categories."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCategories();
  }, []);

  // =====================================================
  // RESET FORM
  // =====================================================

  function resetForm() {
    setName("");
    setDescription("");
    setEditingId(null);
    setShowForm(false);
  }

  // =====================================================
  // START CREATE
  // =====================================================

  function startCreate() {
    setError("");
    setSuccess("");

    setName("");
    setDescription("");
    setEditingId(null);

    setShowForm(true);
  }

  // =====================================================
  // START EDIT
  // =====================================================

  function startEdit(category: Category) {
    setError("");
    setSuccess("");

    setName(category.name);

    setDescription(
      category.description || ""
    );

    setEditingId(category.id);
    setShowForm(true);
  }

  // =====================================================
  // CREATE / UPDATE
  // =====================================================

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (saving) {
      return;
    }

    setError("");
    setSuccess("");

    if (!name.trim()) {
      setError(
        "Category name is required."
      );

      return;
    }

    setSaving(true);

    try {
      // ===================================================
      // UPDATE
      // ===================================================

      if (editingId !== null) {
        const updatedCategory =
          await updateCategory(
            editingId,
            {
              name: name.trim(),
              description:
                description.trim() || null,
            }
          );

        setCategories(
          (current) =>
            current.map(
              (category) =>
                category.id === editingId
                  ? updatedCategory
                  : category
            )
        );

        setSuccess(
          "Category updated successfully."
        );
      }

      // ===================================================
      // CREATE
      // ===================================================

      else {
        const newCategory =
          await createCategory({
            name: name.trim(),
            description:
              description.trim() || null,
          });

        setCategories(
          (current) => [
            ...current,
            newCategory,
          ]
        );

        setSuccess(
          "Category created successfully."
        );
      }

      setName("");
      setDescription("");
      setEditingId(null);
      setShowForm(false);
    } catch (error) {
      console.error(
        "Category save error:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Unable to save category."
      );
    } finally {
      setSaving(false);
    }
  }

  // =====================================================
  // DELETE CATEGORY
  // =====================================================

  async function handleDelete(
    categoryId: number,
    categoryName: string
  ) {
    const confirmed =
      window.confirm(
        `Are you sure you want to permanently delete "${categoryName}"?`
      );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setSuccess("");
      setDeletingId(categoryId);

      await deleteCategory(
        categoryId
      );

      setCategories(
        (current) =>
          current.filter(
            (category) =>
              category.id !== categoryId
          )
      );

      setSuccess(
        "Category deleted successfully."
      );
    } catch (error) {
      console.error(
        "Category delete error:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Unable to delete category."
      );
    } finally {
      setDeletingId(null);
    }
  }

  // =====================================================
  // ACTIVATE / DEACTIVATE
  // =====================================================

  async function handleToggleStatus(
    category: Category
  ) {
    if (statusUpdatingId !== null) {
      return;
    }

    try {
      setError("");
      setSuccess("");

      setStatusUpdatingId(
        category.id
      );

      let updatedCategory: Category;

      // ===================================================
      // INACTIVE -> ACTIVE
      // ===================================================

      if (category.is_active === false) {
        updatedCategory =
          await activateCategory(
            category.id
          );

        setSuccess(
          "Category activated successfully."
        );
      }

      // ===================================================
      // ACTIVE -> INACTIVE
      // ===================================================

      else {
        updatedCategory =
          await deactivateCategory(
            category.id
          );

        setSuccess(
          "Category deactivated successfully."
        );
      }

      // ===================================================
      // UPDATE LOCAL STATE
      // ===================================================

      setCategories(
        (current) =>
          current.map(
            (item) =>
              item.id === category.id
                ? updatedCategory
                : item
          )
      );
    } catch (error) {
      console.error(
        "Category status error:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Unable to update category status."
      );
    } finally {
      setStatusUpdatingId(null);
    }
  }

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <main className="min-h-screen bg-white">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <div className="flex min-h-[300px] items-center justify-center">
            <p className="text-gray-600">
              Loading categories...
            </p>
          </div>
        </div>
      </main>
    );
  }

  // =====================================================
  // PAGE
  // =====================================================

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-6xl px-4 py-10">

        {/* =================================================
            BACK
        ================================================== */}

        <Link
          href="/admin/dashboard"
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition hover:text-black"
        >
          <ArrowLeft className="h-4 w-4" />
          Dashboard
        </Link>

        {/* =================================================
            HEADER
        ================================================== */}

        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">
              ShopSphere Admin
            </p>

            <h1 className="mt-1 text-3xl font-bold text-black">
              Categories
            </h1>

            <p className="mt-1 text-sm text-gray-600">
              Create, update and manage product categories.
            </p>
          </div>

          <button
            type="button"
            onClick={startCreate}
            className="inline-flex items-center justify-center gap-2 rounded-md border border-black bg-white px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-black hover:text-white"
          >
            <Plus className="h-4 w-4" />
            Add Category
          </button>
        </div>

        {/* =================================================
            ERROR
        ================================================== */}

        {error && (
          <div className="mt-6 rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* =================================================
            SUCCESS
        ================================================== */}

        {success && (
          <div className="mt-6 rounded-lg border border-green-300 bg-green-50 p-4 text-sm text-green-700">
            {success}
          </div>
        )}

        {/* =================================================
            ADD / EDIT FORM
        ================================================== */}

        {showForm && (
          <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">

            <div className="flex items-center justify-between">

              <div>
                <h2 className="text-xl font-semibold text-black">
                  {editingId !== null
                    ? "Edit Category"
                    : "Add Category"}
                </h2>

                <p className="mt-1 text-sm text-gray-600">
                  {editingId !== null
                    ? "Update category information."
                    : "Create a new product category."}
                </p>
              </div>

              <button
                type="button"
                onClick={resetForm}
                className="flex h-9 w-9 items-center justify-center rounded-md border border-gray-300 text-black transition hover:border-black"
              >
                <X className="h-4 w-4" />
              </button>

            </div>

            <form
              onSubmit={handleSubmit}
              className="mt-6 space-y-5"
            >

              {/* CATEGORY NAME */}

              <div>
                <label
                  htmlFor="categoryName"
                  className="mb-2 block text-sm font-medium text-black"
                >
                  Category Name
                </label>

                <input
                  id="categoryName"
                  type="text"
                  value={name}
                  onChange={(event) =>
                    setName(
                      event.target.value
                    )
                  }
                  placeholder="Enter category name"
                  disabled={saving}
                  className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm text-black outline-none focus:border-black"
                />
              </div>

              {/* DESCRIPTION */}

              <div>
                <label
                  htmlFor="categoryDescription"
                  className="mb-2 block text-sm font-medium text-black"
                >
                  Description
                </label>

                <textarea
                  id="categoryDescription"
                  value={description}
                  onChange={(event) =>
                    setDescription(
                      event.target.value
                    )
                  }
                  placeholder="Enter category description"
                  rows={4}
                  disabled={saving}
                  className="w-full resize-none rounded-md border border-gray-300 px-3 py-2.5 text-sm text-black outline-none focus:border-black"
                />
              </div>

              {/* FORM BUTTONS */}

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

                <button
                  type="button"
                  onClick={resetForm}
                  disabled={saving}
                  className="rounded-md border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-black transition hover:border-black disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-md border border-black bg-white px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : editingId !== null
                      ? "Update Category"
                      : "Create Category"}
                </button>

              </div>

            </form>
          </div>
        )}

        {/* =================================================
            TOTAL
        ================================================== */}

        <div className="mt-6 rounded-lg border border-gray-200 bg-white px-5 py-4">
          <p className="text-sm text-gray-600">
            Total Categories{" "}
            <span className="font-semibold text-black">
              {categories.length}
            </span>
          </p>
        </div>

        {/* =================================================
            EMPTY
        ================================================== */}

        {categories.length === 0 ? (
          <div className="mt-6 rounded-xl border border-gray-200 bg-white p-12 text-center">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-gray-200 bg-gray-50">
              <FolderTree className="h-8 w-8 text-gray-500" />
            </div>

            <h2 className="mt-5 text-xl font-semibold text-black">
              No categories found
            </h2>

            <p className="mt-2 text-sm text-gray-600">
              Create your first category.
            </p>

            <button
              type="button"
              onClick={startCreate}
              className="mt-6 inline-flex items-center gap-2 rounded-md border border-black bg-white px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-black hover:text-white"
            >
              <Plus className="h-4 w-4" />
              Add Category
            </button>

          </div>
        ) : (

          /* =================================================
             CATEGORY TABLE
          ================================================== */

          <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white">

            <div className="overflow-x-auto">

              <table className="w-full min-w-[900px]">

                <thead className="border-b border-gray-200 bg-gray-50">
                  <tr>

                    <th className="px-6 py-4 text-left text-sm font-semibold text-black">
                      Category
                    </th>

                    <th className="px-6 py-4 text-left text-sm font-semibold text-black">
                      Description
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

                  {categories.map(
                    (category) => {

                      // IMPORTANT:
                      // true = active
                      // false = inactive
                      const isActive =
                        category.is_active === true;

                      const updating =
                        statusUpdatingId ===
                        category.id;

                      const deleting =
                        deletingId ===
                        category.id;

                      return (
                        <tr
                          key={category.id}
                          className="transition hover:bg-gray-50"
                        >

                          {/* CATEGORY */}

                          <td className="px-6 py-5">
                            <p className="font-semibold text-black">
                              {category.name}
                            </p>

                            <p className="mt-1 text-xs text-gray-500">
                              ID: {category.id}
                            </p>
                          </td>

                          {/* DESCRIPTION */}

                          <td className="max-w-md px-6 py-5">
                            <p className="text-sm text-gray-600">
                              {category.description ||
                                "No description"}
                            </p>
                          </td>

                          {/* STATUS */}

                          <td className="px-6 py-5">

                            {isActive ? (
                              <span className="inline-flex rounded-full border border-green-300 bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                                Active
                              </span>
                            ) : (
                              <span className="inline-flex rounded-full border border-red-300 bg-red-50 px-3 py-1 text-xs font-medium text-red-700">
                                Inactive
                              </span>
                            )}

                          </td>

                          {/* ACTIONS */}

                          <td className="px-6 py-5">

                            <div className="flex items-center justify-end gap-2">

                              {/* EDIT */}

                              <button
                                type="button"
                                onClick={() =>
                                  startEdit(
                                    category
                                  )
                                }
                                disabled={
                                  updating ||
                                  deleting
                                }
                                className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-black transition hover:border-black disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <Edit className="h-4 w-4" />

                                Edit
                              </button>

                              {/* ACTIVATE / DEACTIVATE */}

                              <button
                                type="button"
                                onClick={() =>
                                  handleToggleStatus(
                                    category
                                  )
                                }
                                disabled={
                                  updating ||
                                  deleting
                                }
                                className={`rounded-md px-4 py-2 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${
                                  isActive
                                    ? "bg-red-600 hover:bg-red-700"
                                    : "bg-green-600 hover:bg-green-700"
                                }`}
                              >
                                {updating
                                  ? "Updating..."
                                  : isActive
                                    ? "Deactivate"
                                    : "Activate"}
                              </button>

                              {/* DELETE */}

                              <button
                                type="button"
                                onClick={() =>
                                  handleDelete(
                                    category.id,
                                    category.name
                                  )
                                }
                                disabled={
                                  updating ||
                                  deleting
                                }
                                className="inline-flex items-center gap-2 rounded-md border border-black bg-white px-3 py-2 text-sm font-medium text-black transition hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <Trash2 className="h-4 w-4" />

                                {deleting
                                  ? "Deleting..."
                                  : "Delete"}
                              </button>

                            </div>

                          </td>

                        </tr>
                      );
                    }
                  )}

                </tbody>
              </table>

            </div>
          </div>
        )}

      </div>
    </main>
  );
}