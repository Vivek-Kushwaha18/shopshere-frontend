
import { apiFetch } from "./api";

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  icon_url?: string | null;
  parent_id: number | null;
  is_active: boolean;
}

export interface CategoryCreateData {
  name: string;
  description?: string | null;
  parent_id?: number | null;
  file?: File | null;
}

export interface CategoryUpdateData {
  name: string;
  description?: string | null;
  parent_id?: number | null;
}

const ADMIN_INACTIVE_CATEGORIES_KEY =
  "shopsphere_admin_inactive_categories";

let categoriesCache: Category[] | null = null;
let categoriesRequest: Promise<Category[]> | null = null;

export function clearCategoriesCache(): void {
  categoriesCache = null;
}

function getErrorMessage(
  response: { status?: number; data?: any },
  fallback: string
): string {
  const detail = response.data?.detail;

  if (typeof detail === "string") {
    return detail;
  }

  if (Array.isArray(detail)) {
    return detail
      .map((item) =>
        typeof item === "string"
          ? item
          : item?.msg || "Validation error"
      )
      .join(", ");
  }

  return `${fallback}${
    response.status ? ` Status: ${response.status}` : ""
  }`;
}

function getStoredInactiveCategories(): Category[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const stored = localStorage.getItem(
      ADMIN_INACTIVE_CATEGORIES_KEY
    );

    if (!stored) {
      return [];
    }

    const parsed: unknown = JSON.parse(stored);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(
      (item): item is Category =>
        typeof item === "object" &&
        item !== null &&
        typeof item.id === "number" &&
        typeof item.name === "string"
    );
  } catch {
    return [];
  }
}

function saveStoredInactiveCategories(
  categories: Category[]
): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(
    ADMIN_INACTIVE_CATEGORIES_KEY,
    JSON.stringify(categories)
  );
}

function addStoredInactiveCategory(
  category: Category
): void {
  const updated = getStoredInactiveCategories().filter(
    (item) => item.id !== category.id
  );

  updated.push({
    ...category,
    is_active: false,
  });

  saveStoredInactiveCategories(updated);
}

function removeStoredInactiveCategory(
  categoryId: number
): void {
  saveStoredInactiveCategories(
    getStoredInactiveCategories().filter(
      (item) => item.id !== categoryId
    )
  );
}

export async function getCategories(): Promise<
  Category[]
> {
  if (categoriesCache !== null) {
    return categoriesCache;
  }

  if (categoriesRequest !== null) {
    return categoriesRequest;
  }

  categoriesRequest = apiFetch("/categories/")
    .then((response) => {
      if (!response.success) {
        throw new Error(
          getErrorMessage(
            response,
            "Unable to fetch categories."
          )
        );
      }

      if (!Array.isArray(response.data)) {
        throw new Error("Invalid categories response.");
      }

      const categories = response.data as Category[];

      categoriesCache = categories;

      return categories;
    })
    .finally(() => {
      categoriesRequest = null;
    });

  return categoriesRequest;
}

export async function getAdminCategories(): Promise<
  Category[]
> {
  const activeCategories = await getCategories();

  const inactiveCategories =
    getStoredInactiveCategories();

  const activeIds = new Set(
    activeCategories.map((category) => category.id)
  );

  const validInactiveCategories =
    inactiveCategories.filter(
      (category) => !activeIds.has(category.id)
    );

  saveStoredInactiveCategories(
    validInactiveCategories
  );

  return [
    ...activeCategories,
    ...validInactiveCategories,
  ].sort((a, b) => a.name.localeCompare(b.name));
}

export async function getCategory(
  categoryId: number
): Promise<Category> {
  const response = await apiFetch(
    `/categories/${categoryId}`
  );

  if (!response.success) {
    throw new Error(
      getErrorMessage(
        response,
        "Unable to fetch category."
      )
    );
  }

  return response.data as Category;
}

export async function createCategory(
  categoryData: CategoryCreateData
): Promise<Category> {
  const name = categoryData.name.trim();

  if (!name) {
    throw new Error(
      "Category name cannot be empty."
    );
  }

  if (
    categoryData.parent_id == null &&
    !categoryData.file
  ) {
    throw new Error(
      "Main category icon is required."
    );
  }

  const formData = new FormData();

  formData.append("name", name);

  if (categoryData.description?.trim()) {
    formData.append(
      "description",
      categoryData.description.trim()
    );
  }

  if (categoryData.parent_id != null) {
    formData.append(
      "parent_id",
      String(categoryData.parent_id)
    );
  }

  if (categoryData.file) {
    formData.append(
      "file",
      categoryData.file
    );
  }

  const response = await apiFetch(
    "/categories/",
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.success) {
    throw new Error(
      getErrorMessage(
        response,
        "Unable to create category."
      )
    );
  }

  const category = response.data as Category;

  removeStoredInactiveCategory(category.id);
  clearCategoriesCache();

  return category;
}

export async function uploadCategoryIcon(
  categoryId: number,
  file: File
): Promise<Category> {
  const formData = new FormData();

  formData.append("file", file);

  const response = await apiFetch(
    `/categories/${categoryId}/icon`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.success) {
    throw new Error(
      getErrorMessage(
        response,
        "Unable to upload category icon."
      )
    );
  }

  const category = response.data as Category;

  if (!category.is_active) {
    addStoredInactiveCategory(category);
  }

  clearCategoriesCache();

  return category;
}

// =====================================================
// DELETE CATEGORY ICON
// =====================================================

export async function deleteCategoryIcon(
  categoryId: number
): Promise<Category> {
  const response = await apiFetch(
    `/categories/${categoryId}/icon`,
    {
      method: "DELETE",
    }
  );

  if (!response.success) {
    throw new Error(
      getErrorMessage(
        response,
        "Unable to delete category icon."
      )
    );
  }

  const category = response.data as Category;

  if (!category.is_active) {
    addStoredInactiveCategory(category);
  }

  clearCategoriesCache();

  return category;
}

export async function updateCategory(
  categoryId: number,
  categoryData: CategoryUpdateData
): Promise<Category> {
  const cleanedData: CategoryUpdateData = {
    name: categoryData.name.trim(),
    description:
      categoryData.description?.trim() || null,
    parent_id:
      categoryData.parent_id ?? null,
  };

  if (!cleanedData.name) {
    throw new Error(
      "Category name cannot be empty."
    );
  }

  const response = await apiFetch(
    `/categories/${categoryId}`,
    {
      method: "PUT",
      body: JSON.stringify(cleanedData),
    }
  );

  if (!response.success) {
    throw new Error(
      getErrorMessage(
        response,
        "Unable to update category."
      )
    );
  }

  const category = response.data as Category;

  const existingInactive =
    getStoredInactiveCategories().some(
      (item) => item.id === categoryId
    );

  if (
    existingInactive ||
    category.is_active === false
  ) {
    addStoredInactiveCategory({
      ...category,
      is_active: false,
    });
  } else {
    removeStoredInactiveCategory(categoryId);
  }

  clearCategoriesCache();

  return category;
}

export async function activateCategory(
  categoryId: number
): Promise<Category> {
  const response = await apiFetch(
    `/categories/${categoryId}/activate`,
    {
      method: "PATCH",
    }
  );

  if (!response.success) {
    throw new Error(
      getErrorMessage(
        response,
        "Unable to activate category."
      )
    );
  }

  const category = {
    ...(response.data as Category),
    is_active: true,
  };

  removeStoredInactiveCategory(categoryId);
  clearCategoriesCache();

  return category;
}

export async function deactivateCategory(
  categoryId: number
): Promise<Category> {
  const response = await apiFetch(
    `/categories/${categoryId}/deactivate`,
    {
      method: "PATCH",
    }
  );

  if (!response.success) {
    throw new Error(
      getErrorMessage(
        response,
        "Unable to deactivate category."
      )
    );
  }

  const category = {
    ...(response.data as Category),
    is_active: false,
  };

  addStoredInactiveCategory(category);
  clearCategoriesCache();

  return category;
}

export async function deleteCategory(
  categoryId: number
): Promise<void> {
  const response = await apiFetch(
    `/categories/${categoryId}`,
    {
      method: "DELETE",
    }
  );

  if (!response.success) {
    throw new Error(
      getErrorMessage(
        response,
        "Unable to delete category."
      )
    );
  }

  removeStoredInactiveCategory(categoryId);
  clearCategoriesCache();
}
