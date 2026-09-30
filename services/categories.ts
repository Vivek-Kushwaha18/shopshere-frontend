import { apiFetch } from "./api";

export interface Category {
  id: number;
  name: string;
  description?: string | null;
  is_active: boolean;
}

export interface CategoryCreateData {
  name: string;
  description?: string | null;
}

export interface CategoryUpdateData {
  name: string;
  description?: string | null;
}

const ADMIN_INACTIVE_CATEGORIES_KEY =
  "shopsphere_admin_inactive_categories";

// =====================================================
// CATEGORY CACHE
//
// Used to avoid fetching the same active categories
// repeatedly when navigating between pages.
// =====================================================

let categoriesCache: Category[] | null = null;

let categoriesRequest: Promise<Category[]> | null =
  null;


// =====================================================
// CLEAR CATEGORY CACHE
//
// Call this after category create/update/activate/
// deactivate/delete when the cached category list
// needs to be refreshed.
// =====================================================

export function clearCategoriesCache(): void {
  categoriesCache = null;
}


// =====================================================
// ERROR HELPER
// =====================================================

function getErrorMessage(
  response: {
    status?: number;
    data?: any;
  },
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
    response.status
      ? ` Status: ${response.status}`
      : ""
  }`;
}


// =====================================================
// LOCAL STORAGE
//
// Used only because the current backend does not expose
// an admin endpoint returning inactive categories.
// =====================================================

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
  const current =
    getStoredInactiveCategories();

  const updated = current.filter(
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
  const current =
    getStoredInactiveCategories();

  saveStoredInactiveCategories(
    current.filter(
      (item) => item.id !== categoryId
    )
  );
}


// =====================================================
// GET ACTIVE CATEGORIES
//
// PUBLIC
// Customer
// Seller
// Admin
//
// Backend:
// GET /categories/
//
// Uses cache so navigation between pages does not
// repeatedly fetch the same categories.
// =====================================================

export async function getCategories(): Promise<Category[]> {
  if (categoriesCache !== null) {
    return categoriesCache;
  }

  if (categoriesRequest !== null) {
    return categoriesRequest;
  }

  categoriesRequest = apiFetch(
    "/categories/"
  )
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
        throw new Error(
          "Invalid categories response."
        );
      }

      const categories =
        response.data as Category[];

      categoriesCache = categories;

      return categories;
    })
    .finally(() => {
      categoriesRequest = null;
    });

  return categoriesRequest;
}


// =====================================================
// GET ADMIN CATEGORIES
//
// Returns active categories from backend and inactive
// categories saved locally by the admin actions.
//
// IMPORTANT:
// Inactive categories are browser-local until the backend
// provides an admin/all-categories endpoint.
// =====================================================

export async function getAdminCategories(): Promise<Category[]> {
  const activeCategories =
    await getCategories();

  const inactiveCategories =
    getStoredInactiveCategories();

  const activeIds = new Set(
    activeCategories.map(
      (category) => category.id
    )
  );

  const validInactiveCategories =
    inactiveCategories.filter(
      (category) =>
        !activeIds.has(category.id)
    );

  saveStoredInactiveCategories(
    validInactiveCategories
  );

  return [
    ...activeCategories,
    ...validInactiveCategories,
  ].sort((a, b) =>
    a.name.localeCompare(b.name)
  );
}


// =====================================================
// GET SINGLE CATEGORY
//
// Backend:
// GET /categories/{category_id}
//
// NOTE:
// Backend returns only active categories here.
// =====================================================

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


// =====================================================
// CREATE CATEGORY - ADMIN
//
// Backend:
// POST /categories/
// =====================================================

export async function createCategory(
  categoryData: CategoryCreateData
): Promise<Category> {
  const cleanedData: CategoryCreateData = {
    name: categoryData.name.trim(),
    description:
      categoryData.description?.trim() || null,
  };

  if (!cleanedData.name) {
    throw new Error(
      "Category name cannot be empty."
    );
  }

  const response = await apiFetch(
    "/categories/",
    {
      method: "POST",
      body: JSON.stringify(cleanedData),
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

  const category =
    response.data as Category;

  removeStoredInactiveCategory(
    category.id
  );

  clearCategoriesCache();

  return category;
}


// =====================================================
// UPDATE CATEGORY - ADMIN
//
// Backend:
// PUT /categories/{category_id}
// =====================================================

export async function updateCategory(
  categoryId: number,
  categoryData: CategoryUpdateData
): Promise<Category> {
  const cleanedData: CategoryUpdateData = {
    name: categoryData.name.trim(),
    description:
      categoryData.description?.trim() || null,
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

  const category =
    response.data as Category;

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
    removeStoredInactiveCategory(
      categoryId
    );
  }

  clearCategoriesCache();

  return category;
}


// =====================================================
// ACTIVATE CATEGORY - ADMIN
//
// Backend:
// PATCH /categories/{category_id}/activate
// =====================================================

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

  removeStoredInactiveCategory(
    categoryId
  );

  clearCategoriesCache();

  return category;
}


// =====================================================
// DEACTIVATE CATEGORY - ADMIN
//
// Backend:
// PATCH /categories/{category_id}/deactivate
// =====================================================

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

  addStoredInactiveCategory(
    category
  );

  clearCategoriesCache();

  return category;
}


// =====================================================
// DELETE CATEGORY - ADMIN
//
// Backend:
// DELETE /categories/{category_id}
// =====================================================

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

  removeStoredInactiveCategory(
    categoryId
  );

  clearCategoriesCache();
}