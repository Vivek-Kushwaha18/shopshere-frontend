
"use client";

import { FormEvent, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Swal from "sweetalert2";
import {
  FolderTree,
  Pencil,
  Plus,
  Power,
  Trash2,
  X,
} from "lucide-react";

import {
  activateCategory,
  createCategory,
  deactivateCategory,
  deleteCategory,
  deleteCategoryIcon,
  getAdminCategories,
  updateCategory,
  uploadCategoryIcon,
  type Category,
} from "@/services/categories";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusUpdatingId, setStatusUpdatingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [iconDeleting, setIconDeleting] = useState(false);

  const [mounted, setMounted] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [iconPreview, setIconPreview] = useState<string | null>(null);
  const [parentId, setParentId] = useState<number | null>(null);
  const [selectedParentIds, setSelectedParentIds] = useState<string[]>([]);

  async function loadCategories() {
    try {
      setLoading(true);
      const data = await getAdminCategories();
      setCategories(data);
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "Error",
        text:
          error instanceof Error
            ? error.message
            : "Unable to load categories.",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setMounted(true);
    void loadCategories();
  }, []);

  function getChildCategories(
    currentParentId: number | null
  ): Category[] {
    if (!categories) return [];

    return categories
      .filter(
        (category) =>
          category.parent_id === currentParentId &&
          category.id !== editingId
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  function isDescendant(
    categoryId: number,
    possibleParentId: number
  ): boolean {
    if (!categories) return false;

    let currentParentId =
      categories.find(
        (category) => category.id === categoryId
      )?.parent_id ?? null;

    const visited = new Set<number>();

    while (
      currentParentId !== null &&
      !visited.has(currentParentId)
    ) {
      if (currentParentId === possibleParentId) {
        return true;
      }

      visited.add(currentParentId);

      currentParentId =
        categories.find(
          (category) => category.id === currentParentId
        )?.parent_id ?? null;
    }

    return false;
  }

  function canSelectAsParent(category: Category): boolean {
    if (editingId === null) return true;
    if (category.id === editingId) return false;
    if (isDescendant(category.id, editingId)) return false;
    return true;
  }

  function getAvailableChildCategories(
    currentParentId: number | null
  ): Category[] {
    return getChildCategories(currentParentId).filter(
      canSelectAsParent
    );
  }

  function handleParentChange(level: number, value: string) {
    const updated = selectedParentIds.slice(0, level);

    if (value) {
      updated.push(value);
    }

    setSelectedParentIds(updated);

    setParentId(
      updated.length > 0
        ? Number(updated[updated.length - 1])
        : null
    );
  }

  function getParentCategoryLevels(): Category[][] {
    const levels: Category[][] = [];
    let currentParentId: number | null = null;

    for (
      let level = 0;
      level <= selectedParentIds.length;
      level++
    ) {
      const options =
        getAvailableChildCategories(currentParentId);

      if (options.length === 0) break;

      levels.push(options);

      const selectedId = selectedParentIds[level];

      if (!selectedId) break;

      currentParentId = Number(selectedId);
    }

    return levels;
  }

  function resetForm() {
    setName("");
    setDescription("");
    setIconFile(null);
    setIconPreview(null);
    setParentId(null);
    setSelectedParentIds([]);
    setEditingId(null);
    setShowForm(false);
  }

  function startCreate() {
    setName("");
    setDescription("");
    setIconFile(null);
    setIconPreview(null);
    setParentId(null);
    setSelectedParentIds([]);
    setEditingId(null);
    setShowForm(true);
  }

  function startEdit(category: Category) {
    setName(category.name);
    setDescription(category.description || "");
    setIconFile(null);
    setIconPreview(category.icon_url || null);
    setParentId(category.parent_id ?? null);
    setEditingId(category.id);

    const parentPath: number[] = [];
    const visited = new Set<number>();

    let currentParentId = category.parent_id ?? null;

    while (
      currentParentId !== null &&
      !visited.has(currentParentId)
    ) {
      visited.add(currentParentId);
      parentPath.unshift(currentParentId);

      const parent = categories?.find(
        (item) => item.id === currentParentId
      );

      currentParentId = parent?.parent_id ?? null;
    }

    setSelectedParentIds(parentPath.map(String));
    setShowForm(true);
  }

  async function handleDeleteIcon() {
    if (editingId === null || iconDeleting || saving) return;

    const category = categories?.find(
      (item) => item.id === editingId
    );

    if (!category?.icon_url) return;

    if (category.parent_id === null) {
      await Swal.fire({
        icon: "warning",
        title: "Cannot delete icon",
        text: "Main category icons cannot be deleted. Upload a replacement icon instead.",
      });
      return;
    }

    const result = await Swal.fire({
      icon: "warning",
      title: "Delete category icon?",
      text: "This will permanently remove the category icon. The category itself will not be deleted.",
      showCancelButton: true,
      confirmButtonText: "Delete Icon",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#dc2626",
    });

    if (!result.isConfirmed) return;

    try {
      setIconDeleting(true);

      const updated = await deleteCategoryIcon(editingId);

      setCategories((current) =>
        current
          ? current.map((item) =>
              item.id === editingId ? updated : item
            )
          : current
      );

      setIconFile(null);
      setIconPreview(null);

      await Swal.fire({
        icon: "success",
        title: "Icon deleted",
        text: "Category icon deleted successfully.",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "Error",
        text:
          error instanceof Error
            ? error.message
            : "Unable to delete category icon.",
      });
    } finally {
      setIconDeleting(false);
    }
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const trimmedName = name.trim();

    if (!trimmedName) {
      await Swal.fire({
        icon: "warning",
        title: "Category name required",
        text: "Please enter a category name.",
      });
      return;
    }

    if (
      editingId === null &&
      parentId === null &&
      !iconFile
    ) {
      await Swal.fire({
        icon: "warning",
        title: "Category icon required",
        text: "Please upload an icon for the main category.",
      });
      return;
    }

    try {
      setSaving(true);

      if (editingId !== null) {
        const existingCategory = categories?.find(
          (item) => item.id === editingId
        );

        let iconUploadedFirst = false;

        if (
          parentId === null &&
          !existingCategory?.icon_url &&
          iconFile
        ) {
          await uploadCategoryIcon(editingId, iconFile);
          iconUploadedFirst = true;
        }

        let updated = await updateCategory(editingId, {
          name: trimmedName,
          description: description.trim() || null,
          parent_id: parentId,
        });

        if (iconFile && !iconUploadedFirst) {
          updated = await uploadCategoryIcon(
            editingId,
            iconFile
          );
        }

        setCategories((current) =>
          current
            ? current.map((category) =>
                category.id === editingId
                  ? updated
                  : category
              )
            : current
        );

        resetForm();

        await Swal.fire({
          icon: "success",
          title: "Category updated",
          text: "Category updated successfully.",
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        const created = await createCategory({
          name: trimmedName,
          description: description.trim() || null,
          parent_id: parentId,
          file: iconFile,
        });

        setCategories((current) =>
          current
            ? [...current, created].sort((a, b) =>
                a.name.localeCompare(b.name)
              )
            : [created]
        );

        resetForm();

        await Swal.fire({
          icon: "success",
          title: "Category created",
          text: "Category created successfully.",
          timer: 1500,
          showConfirmButton: false,
        });
      }

      await loadCategories();
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "Error",
        text:
          error instanceof Error
            ? error.message
            : "Unable to save category.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(category: Category) {
    const result = await Swal.fire({
      icon: "warning",
      title: "Delete category?",
      text: `Are you sure you want to delete "${category.name}"?`,
      showCancelButton: true,
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#dc2626",
    });

    if (!result.isConfirmed) return;

    try {
      setDeletingId(category.id);
      await deleteCategory(category.id);

      setCategories((current) =>
        current
          ? current.filter(
              (item) => item.id !== category.id
            )
          : current
      );

      await Swal.fire({
        icon: "success",
        title: "Category deleted",
        text: "Category deleted successfully.",
        timer: 1200,
        showConfirmButton: false,
      });
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "Error",
        text:
          error instanceof Error
            ? error.message
            : "Unable to delete category.",
      });
    } finally {
      setDeletingId(null);
    }
  }

  async function handleToggleStatus(category: Category) {
    try {
      setStatusUpdatingId(category.id);

      const updated = category.is_active
        ? await deactivateCategory(category.id)
        : await activateCategory(category.id);

      setCategories((current) =>
        current
          ? current.map((item) =>
              item.id === category.id ? updated : item
            )
          : current
      );

      await Swal.fire({
        icon: "success",
        title: category.is_active
          ? "Category deactivated"
          : "Category activated",
        timer: 1200,
        showConfirmButton: false,
      });
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "Error",
        text:
          error instanceof Error
            ? error.message
            : "Unable to update category status.",
      });
    } finally {
      setStatusUpdatingId(null);
    }
  }

  function getParentName(category: Category): string {
    if (category.parent_id === null) return "None";

    const parent = categories?.find(
      (item) => item.id === category.parent_id
    );

    return parent?.name || "Unknown";
  }

  const parentCategoryLevels = getParentCategoryLevels();

  const editingCategory = categories?.find(
    (item) => item.id === editingId
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Categories
          </h1>

          <p className="text-sm text-gray-500">
            Manage your product category hierarchy.
          </p>
        </div>

        <button
          type="button"
          onClick={startCreate}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
        >
          <Plus size={18} />
          Add Category
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h2 className="font-semibold text-gray-900">
              All Categories
            </h2>

            <p className="text-sm text-gray-500">
              {categories?.length ?? 0} categories
            </p>
          </div>

          <button
            type="button"
            onClick={startCreate}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
          >
            <Plus size={18} />
            Add Category
          </button>
        </div>

        {loading ? (
          <div className="px-6 py-12 text-center text-sm text-gray-500">
            Loading categories...
          </div>
        ) : !categories || categories.length === 0 ? (
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
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
            >
              <Plus size={18} />
              Add Category
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left">
                    Category
                  </th>
                  <th className="px-4 py-3 text-left">
                    Parent
                  </th>
                  <th className="px-4 py-3 text-left">
                    Description
                  </th>
                  <th className="px-4 py-3 text-left">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {categories.map((category) => (
                  <tr
                    key={category.id}
                    className="border-b last:border-b-0 hover:bg-gray-50"
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        {category.parent_id !== null && (
                          <span className="text-gray-400">
                            └─
                          </span>
                        )}

                        {category.icon_url ? (
                          <img
                            src={category.icon_url}
                            alt={category.name}
                            className="h-10 w-10 shrink-0 rounded-md border object-contain"
                          />
                        ) : (
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-gray-100">
                            <FolderTree
                              size={18}
                              className="text-gray-400"
                            />
                          </div>
                        )}

                        <span className="font-medium text-gray-900">
                          {category.name}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-4 text-gray-600">
                      {getParentName(category)}
                    </td>

                    <td className="max-w-xs px-4 py-4 text-gray-600">
                      <div className="truncate">
                        {category.description || "—"}
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
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

                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            startEdit(category)
                          }
                          disabled={
                            saving ||
                            iconDeleting ||
                            statusUpdatingId !== null ||
                            deletingId !== null
                          }
                          className="rounded-lg border p-2 hover:bg-gray-50 disabled:opacity-50"
                          title="Edit"
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleToggleStatus(category)
                          }
                          disabled={
                            statusUpdatingId !== null ||
                            deletingId !== null
                          }
                          className="rounded-lg border p-2 hover:bg-gray-50 disabled:opacity-50"
                          title={
                            category.is_active
                              ? "Deactivate"
                              : "Activate"
                          }
                        >
                          <Power size={16} />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleDelete(category)
                          }
                          disabled={
                            deletingId !== null ||
                            statusUpdatingId !== null
                          }
                          className="rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50 disabled:opacity-50"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {mounted &&
        showForm &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="category-dialog-title"
              className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-xl"
            >
              <div className="flex items-center justify-between border-b px-6 py-4">
                <h2
                  id="category-dialog-title"
                  className="text-lg font-semibold text-gray-900"
                >
                  {editingId !== null
                    ? "Edit Category"
                    : "Create Category"}
                </h2>

                <button
                  type="button"
                  onClick={() => {
                    if (!saving && !iconDeleting) {
                      resetForm();
                    }
                  }}
                  disabled={saving || iconDeleting}
                  className="rounded-lg p-2 hover:bg-gray-100 disabled:opacity-50"
                  aria-label="Close"
                >
                  <X size={20} />
                </button>
              </div>

              <form
                onSubmit={handleSubmit}
                className="space-y-5 p-6"
              >
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
                      setName(event.target.value)
                    }
                    placeholder="e.g. Electronics"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-black"
                    disabled={saving || iconDeleting}
                    required
                  />
                </div>

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
                      setDescription(event.target.value)
                    }
                    placeholder="Optional category description"
                    rows={3}
                    className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-black"
                    disabled={saving || iconDeleting}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Parent Category
                  </label>

                  <div className="space-y-4">
                    {parentCategoryLevels.length === 0 && (
                      <p className="text-sm text-gray-500">
                        No parent categories available.
                        This category will be created at
                        the top level.
                      </p>
                    )}

                    {parentCategoryLevels.map(
                      (levelCategories, level) => (
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
                              selectedParentIds[level] || ""
                            }
                            onChange={(event) =>
                              handleParentChange(
                                level,
                                event.target.value
                              )
                            }
                            disabled={saving || iconDeleting}
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-black"
                          >
                            <option value="">
                              {level === 0
                                ? "None — Top Level Category"
                                : "Select subcategory"}
                            </option>

                            {levelCategories.map(
                              (category) => (
                                <option
                                  key={category.id}
                                  value={category.id}
                                >
                                  {category.name}
                                </option>
                              )
                            )}
                          </select>
                        </div>
                      )
                    )}
                  </div>

                  <p className="mt-2 text-xs text-gray-500">
                    Select a main category first. If it has
                    subcategories, another dropdown will
                    appear automatically.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="category-icon"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Category Icon{" "}
                    {editingId === null && parentId === null
                      ? "(Required)"
                      : "(Optional)"}
                  </label>

                  <input
                    id="category-icon"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    disabled={saving || iconDeleting}
                    onChange={(event) => {
                      const file =
                        event.target.files?.[0] ?? null;

                      if (
                        file &&
                        file.size > 2 * 1024 * 1024
                      ) {
                        void Swal.fire({
                          icon: "warning",
                          title: "File too large",
                          text: "Category icon must not exceed 2 MB.",
                        });

                        event.target.value = "";
                        return;
                      }

                      setIconFile(file);

                      setIconPreview(
                        file
                          ? URL.createObjectURL(file)
                          : editingId !== null
                          ? categories?.find(
                              (item) =>
                                item.id === editingId
                            )?.icon_url || null
                          : null
                      );
                    }}
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
                  />

                  {iconPreview && (
                    <div className="mt-3 flex items-center gap-4">
                      <img
                        src={iconPreview}
                        alt="Category icon preview"
                        className="h-20 w-20 rounded-lg border object-contain"
                      />

                      {editingId !== null &&
                        editingCategory?.icon_url &&
                        editingCategory.parent_id !== null && (
                          <button
                            type="button"
                            onClick={handleDeleteIcon}
                            disabled={saving || iconDeleting}
                            className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                          >
                            <Trash2 size={16} />
                            {iconDeleting
                              ? "Deleting..."
                              : "Delete Icon"}
                          </button>
                        )}
                    </div>
                  )}

                  {editingId !== null &&
                    editingCategory?.icon_url &&
                    editingCategory.parent_id === null && (
                      <p className="mt-2 text-xs text-gray-500">
                        Main category icons cannot be deleted.
                        You can upload a replacement icon.
                      </p>
                    )}

                  <p className="mt-2 text-xs text-gray-500">
                    JPG, PNG or WEBP, maximum 2 MB.
                  </p>
                </div>

                <div className="flex justify-end gap-3 border-t pt-5">
                  <button
                    type="button"
                    onClick={resetForm}
                    disabled={saving || iconDeleting}
                    className="rounded-lg border px-4 py-2.5 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving || iconDeleting}
                    className="rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
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
          </div>,
          document.body
        )}
    </div>
  );
}
