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
  activateCategory,
  createCategory,
  deactivateCategory,
  deleteCategory,
  getAdminCategories,
  updateCategory,
  type Category,
} from "@/services/categories";

export default function AdminCategoriesPage() {
  const [categories, setCategories] =
    useState<Category[] | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [statusUpdatingId, setStatusUpdatingId] =
    useState<number | null>(null);

  const [deletingId, setDeletingId] =
    useState<number | null>(null);

  const [error, setError] =
    useState<string | null>(null);

  const [success, setSuccess] =
    useState<string | null>(null);

  const [showForm, setShowForm] =
    useState(false);

  const [editingId, setEditingId] =
    useState<number | null>(null);

  const [name, setName] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [parentId, setParentId] =
    useState<number | null>(null);

  const [selectedParentIds, setSelectedParentIds] =
    useState<string[]>([]);

  // =====================================================
  // LOAD CATEGORIES
  // =====================================================

  async function loadCategories() {
    try {
      setLoading(true);
      setError(null);

      const data =
        await getAdminCategories();

      setCategories(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
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
  // GET CHILD CATEGORIES
  // =====================================================

  function getChildCategories(
    currentParentId: number | null
  ): Category[] {
    if (!categories) {
      return [];
    }

    return categories
      .filter(
        (category) =>
          category.parent_id ===
            currentParentId &&
          category.id !== editingId
      )
      .sort((a, b) =>
        a.name.localeCompare(b.name)
      );
  }

  // =====================================================
  // CHECK IF CATEGORY IS DESCENDANT
  // =====================================================

  function isDescendant(
    categoryId: number,
    possibleParentId: number
  ): boolean {
    if (!categories) {
      return false;
    }

    let currentParentId =
      categories.find(
        (category) =>
          category.id === categoryId
      )?.parent_id ?? null;

    while (currentParentId !== null) {
      if (
        currentParentId ===
        possibleParentId
      ) {
        return true;
      }

      currentParentId =
        categories.find(
          (category) =>
            category.id ===
            currentParentId
        )?.parent_id ?? null;
    }

    return false;
  }

  // =====================================================
  // CHECK IF CATEGORY CAN BE SELECTED AS PARENT
  // =====================================================

  function canSelectAsParent(
    category: Category
  ): boolean {
    if (editingId === null) {
      return true;
    }

    if (category.id === editingId) {
      return false;
    }

    if (
      isDescendant(
        editingId,
        category.id
      )
    ) {
      return false;
    }

    return true;
  }

  // =====================================================
  // GET AVAILABLE CHILD CATEGORIES
  // =====================================================

  function getAvailableChildCategories(
    currentParentId: number | null
  ): Category[] {
    return getChildCategories(
      currentParentId
    ).filter(
      canSelectAsParent
    );
  }

  // =====================================================
  // HANDLE PARENT CATEGORY CHANGE
  // =====================================================

  function handleParentChange(
    level: number,
    value: string
  ) {
    const updated =
      selectedParentIds.slice(0, level);

    if (value) {
      updated.push(value);
    }

    setSelectedParentIds(updated);

    setParentId(
      updated.length > 0
        ? Number(
            updated[
              updated.length - 1
            ]
          )
        : null
    );
  }

  // =====================================================
  // GET PARENT CATEGORY DROPDOWNS
  // =====================================================

  function getParentCategoryLevels(): Category[][] {
    const levels: Category[][] = [];

    let currentParentId:
      | number
      | null = null;

    for (
      let level = 0;
      level <=
        selectedParentIds.length;
      level++
    ) {
      const options =
        getAvailableChildCategories(
          currentParentId
        );

      if (options.length === 0) {
        break;
      }

      levels.push(options);

      const selectedId =
        selectedParentIds[level];

      if (!selectedId) {
        break;
      }

      currentParentId =
        Number(selectedId);
    }

    return levels;
  }

  // =====================================================
  // RESET FORM
  // =====================================================

  function resetForm() {
    setName("");
    setDescription("");
    setParentId(null);
    setSelectedParentIds([]);
    setEditingId(null);
    setShowForm(false);
  }

  // =====================================================
  // CREATE
  // =====================================================

  function startCreate() {
    setName("");
    setDescription("");
    setParentId(null);
    setSelectedParentIds([]);
    setEditingId(null);
    setError(null);
    setSuccess(null);
    setShowForm(true);
  }

  // =====================================================
  // EDIT
  // =====================================================

  function startEdit(category: Category) {
    setName(category.name);

    setDescription(
      category.description || ""
    );

    setParentId(
      category.parent_id ?? null
    );

    setEditingId(category.id);
    setError(null);
    setSuccess(null);
    setShowForm(true);

    // Build the existing parent path
    const parentPath: number[] = [];

    let currentParentId =
      category.parent_id ?? null;

    while (currentParentId !== null) {
      parentPath.unshift(
        currentParentId
      );

      const parent =
        categories?.find(
          (item) =>
            item.id ===
            currentParentId
        );

      currentParentId =
        parent?.parent_id ?? null;
    }

    setSelectedParentIds(
      parentPath.map(String)
    );
  }

  // =====================================================
  // SUBMIT
  // =====================================================

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const trimmedName =
      name.trim();

    if (!trimmedName) {
      setError(
        "Category name is required."
      );
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      if (editingId !== null) {
        const updated =
          await updateCategory(
            editingId,
            {
              name: trimmedName,
              description:
                description.trim() ||
                null,
              parent_id: parentId,
            }
          );

        setCategories((current) =>
          current
            ? current.map(
                (category) =>
                  category.id ===
                  editingId
                    ? updated
                    : category
              )
            : current
        );

        setSuccess(
          "Category updated successfully."
        );
      } else {
        const created =
          await createCategory({
            name: trimmedName,
            description:
              description.trim() ||
              null,
            parent_id: parentId,
          });

        setCategories((current) =>
          current
            ? [
                ...current,
                created,
              ].sort((a, b) =>
                a.name.localeCompare(
                  b.name
                )
              )
            : [created]
        );

        setSuccess(
          "Category created successfully."
        );
      }

      resetForm();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to save category."
      );
    } finally {
      setSaving(false);
    }
  }

  // =====================================================
  // DELETE
  // =====================================================

  async function handleDelete(
    category: Category
  ) {
    const confirmed =
      window.confirm(
        `Are you sure you want to delete "${category.name}"?`
      );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(category.id);
      setError(null);
      setSuccess(null);

      await deleteCategory(
        category.id
      );

      setCategories((current) =>
        current
          ? current.filter(
              (item) =>
                item.id !==
                category.id
            )
          : current
      );

      setSuccess(
        "Category deleted successfully."
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
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
    try {
      setStatusUpdatingId(
        category.id
      );
      setError(null);
      setSuccess(null);

      const updated =
        category.is_active
          ? await deactivateCategory(
              category.id
            )
          : await activateCategory(
              category.id
            );

      setCategories((current) =>
        current
          ? current.map((item) =>
              item.id ===
              category.id
                ? updated
                : item
            )
          : current
      );

      setSuccess(
        category.is_active
          ? "Category deactivated successfully."
          : "Category activated successfully."
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update category status."
      );
    } finally {
      setStatusUpdatingId(null);
    }
  }

  // =====================================================
  // GET PARENT NAME
  // =====================================================

  function getParentName(
    category: Category
  ): string {
    if (category.parent_id === null) {
      return "None";
    }

    const parent =
      categories?.find(
        (item) =>
          item.id ===
          category.parent_id
      );

    return parent?.name || "Unknown";
  }

  // =====================================================
  // PARENT CATEGORY LEVELS
  // =====================================================

  const parentCategoryLevels =
    getParentCategoryLevels();

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

        {/* HEADER */}

        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href="/admin/dashboard"
              className="mb-3 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft size={16} />
              Back to Dashboard
            </Link>

            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-100 p-2 text-blue-600">
                <FolderTree size={22} />
              </div>

              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Categories
                </h1>

                <p className="text-sm text-gray-500">
                  Manage your product category hierarchy.
                </p>
              </div>
            </div>
          </div>

          {!showForm && (
            <button
              type="button"
              onClick={startCreate}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              <Plus size={18} />
              Add Category
            </button>
          )}
        </div>

        {/* ERROR */}

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* SUCCESS */}

        {success && (
          <div className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {success}
          </div>
        )}

        {/* FORM */}

        {showForm && (
          <div className="mb-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {editingId !== null
                    ? "Edit Category"
                    : "Add Category"}
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Create a category and optionally place it under another category.
                </p>
              </div>

              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-5"
            >
              {/* CATEGORY NAME */}

              <div>
                <label
                  htmlFor="category-name"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Category Name
                </label>

                <input
                  id="category-name"
                  type="text"
                  value={name}
                  onChange={(event) =>
                    setName(
                      event.target.value
                    )
                  }
                  placeholder="e.g. Pants"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  disabled={saving}
                />
              </div>

              {/* DESCRIPTION */}

              <div>
                <label
                  htmlFor="category-description"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Description
                </label>

                <textarea
                  id="category-description"
                  value={description}
                  onChange={(event) =>
                    setDescription(
                      event.target.value
                    )
                  }
                  placeholder="Optional category description"
                  rows={3}
                  className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  disabled={saving}
                />
              </div>

              {/* PARENT CATEGORY */}

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Parent Category
                </label>

                <div className="space-y-4">
                  {parentCategoryLevels.map(
                    (
                      levelCategories,
                      level
                    ) => (
                      <div
                        key={`parent-category-level-${level}`}
                      >
                        <label
                          htmlFor={`parent-category-level-${level}`}
                          className="mb-2 block text-xs font-medium text-gray-600"
                        >
                          {level === 0
                            ? "Main Category"
                            : level === 1
                            ? "Subcategory"
                            : `Subcategory Level ${level + 1}`}
                        </label>

                        <select
                          id={`parent-category-level-${level}`}
                          value={
                            selectedParentIds[
                              level
                            ] || ""
                          }
                          onChange={(
                            event
                          ) =>
                            handleParentChange(
                              level,
                              event.target
                                .value
                            )
                          }
                          disabled={
                            saving
                          }
                          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        >
                          <option value="">
                            {level === 0
                              ? "None — Top Level Category"
                              : "Select subcategory"}
                          </option>

                          {levelCategories.map(
                            (
                              category
                            ) => (
                              <option
                                key={
                                  category.id
                                }
                                value={
                                  category.id
                                }
                              >
                                {
                                  category.name
                                }
                              </option>
                            )
                          )}
                        </select>
                      </div>
                    )
                  )}
                </div>

                <p className="mt-1.5 text-xs text-gray-500">
                  Select a main category first. If it has subcategories, another dropdown will appear automatically.
                </p>
              </div>

              {/* BUTTONS */}

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={saving}
                  className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
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

        {/* CATEGORY LIST */}

        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-gray-900">
                  All Categories
                </h2>

                <p className="text-sm text-gray-500">
                  {categories?.length ?? 0} categories
                </p>
              </div>

              {!showForm && (
                <button
                  type="button"
                  onClick={startCreate}
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  <Plus size={16} />
                  Add
                </button>
              )}
            </div>
          </div>

          {/* LOADING */}

          {loading ? (
            <div className="px-6 py-12 text-center text-sm text-gray-500">
              Loading categories...
            </div>
          ) : categories === null ||
            categories.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <FolderTree
                size={40}
                className="mx-auto mb-3 text-gray-300"
              />

              <h3 className="font-medium text-gray-900">
                No categories found
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                Create your first category to get started.
              </p>

              <button
                type="button"
                onClick={startCreate}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
              >
                <Plus size={18} />
                Add Category
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Category
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Parent
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Description
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Status
                    </th>

                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200 bg-white">
                  {categories.map(
                    (category) => (
                      <tr
                        key={category.id}
                        className="hover:bg-gray-50"
                      >
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="flex items-center gap-2">
                            {category.parent_id !==
                              null && (
                              <span className="text-gray-400">
                                └─
                              </span>
                            )}

                            <span className="font-medium text-gray-900">
                              {category.name}
                            </span>
                          </div>
                        </td>

                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                          {getParentName(
                            category
                          )}
                        </td>

                        <td className="max-w-xs px-6 py-4 text-sm text-gray-600">
                          <div className="truncate">
                            {category.description ||
                              "—"}
                          </div>
                        </td>

                        <td className="whitespace-nowrap px-6 py-4">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                              category.is_active
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {category.is_active
                              ? "Active"
                              : "Inactive"}
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-6 py-4">
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
                                saving ||
                                statusUpdatingId !==
                                  null ||
                                deletingId !==
                                  null
                              }
                              className="rounded-lg p-2 text-blue-600 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
                              title="Edit"
                            >
                              <Edit
                                size={17}
                              />
                            </button>

                            {/* STATUS */}

                            <button
                              type="button"
                              onClick={() =>
                                handleToggleStatus(
                                  category
                                )
                              }
                              disabled={
                                statusUpdatingId ===
                                  category.id ||
                                deletingId !==
                                  null
                              }
                              className={`rounded-lg px-3 py-2 text-xs font-medium ${
                                category.is_active
                                  ? "text-orange-600 hover:bg-orange-50"
                                  : "text-green-600 hover:bg-green-50"
                              } disabled:cursor-not-allowed disabled:opacity-50`}
                            >
                              {statusUpdatingId ===
                              category.id
                                ? "..."
                                : category.is_active
                                ? "Deactivate"
                                : "Activate"}
                            </button>

                            {/* DELETE */}

                            <button
                              type="button"
                              onClick={() =>
                                handleDelete(
                                  category
                                )
                              }
                              disabled={
                                deletingId ===
                                  category.id ||
                                statusUpdatingId !==
                                  null
                              }
                              className="rounded-lg p-2 text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                              title="Delete"
                            >
                              <Trash2
                                size={17}
                              />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}