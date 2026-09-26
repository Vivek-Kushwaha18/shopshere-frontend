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
// LOCAL STORAGE HELPERS
// =====================================================

function getStoredInactiveCategories(): Category[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const stored =
      localStorage.getItem(
        ADMIN_INACTIVE_CATEGORIES_KEY
      );

    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed as Category[];
  } catch {
    return [];
  }
}


function saveStoredInactiveCategories(
  categories: Category[]
) {
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
) {
  const current =
    getStoredInactiveCategories();

  const filtered =
    current.filter(
      (item) =>
        item.id !== category.id
    );

  saveStoredInactiveCategories([
    ...filtered,
    {
      ...category,
      is_active: false,
    },
  ]);
}


function removeStoredInactiveCategory(
  categoryId: number
) {
  const current =
    getStoredInactiveCategories();

  const filtered =
    current.filter(
      (item) =>
        item.id !== categoryId
    );

  saveStoredInactiveCategories(
    filtered
  );
}


// =====================================================
// GET ACTIVE CATEGORIES
// PUBLIC
//
// Customers should only see active categories.
// =====================================================

export async function getCategories(): Promise<Category[]> {
  const response = await apiFetch(
    "/categories/"
  );

  if (!response.success) {
    throw new Error(
      response.data?.detail ||
        "Unable to fetch categories."
    );
  }

  if (!Array.isArray(response.data)) {
    throw new Error(
      "Invalid categories response."
    );
  }

  return response.data as Category[];
}


// =====================================================
// GET ADMIN CATEGORIES
//
// Existing backend endpoint is used.
// Inactive categories are restored from local storage.
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

  const allCategories = [
    ...activeCategories,
    ...validInactiveCategories,
  ];

  return allCategories.sort(
    (a, b) =>
      a.name.localeCompare(b.name)
  );
}


// =====================================================
// GET SINGLE CATEGORY
// =====================================================

export async function getCategory(
  categoryId: number
): Promise<Category> {
  const response = await apiFetch(
    `/categories/${categoryId}`
  );

  if (!response.success) {
    throw new Error(
      response.data?.detail ||
        "Unable to fetch category."
    );
  }

  return response.data as Category;
}


// =====================================================
// CREATE CATEGORY - ADMIN
// =====================================================

export async function createCategory(
  categoryData: CategoryCreateData
): Promise<Category> {
  const response = await apiFetch(
    "/categories/",
    {
      method: "POST",
      body: JSON.stringify(categoryData),
    }
  );

  if (!response.success) {
    throw new Error(
      response.data?.detail ||
        "Unable to create category."
    );
  }

  const category =
    response.data as Category;

  removeStoredInactiveCategory(
    category.id
  );

  return category;
}


// =====================================================
// UPDATE CATEGORY - ADMIN
// =====================================================

export async function updateCategory(
  categoryId: number,
  categoryData: CategoryUpdateData
): Promise<Category> {
  const response = await apiFetch(
    `/categories/${categoryId}`,
    {
      method: "PUT",
      body: JSON.stringify(categoryData),
    }
  );

  if (!response.success) {
    throw new Error(
      response.data?.detail ||
        "Unable to update category."
    );
  }

  const category =
    response.data as Category;

  const storedInactive =
    getStoredInactiveCategories();

  const existingInactive =
    storedInactive.find(
      (item) =>
        item.id === categoryId
    );

  if (
    existingInactive &&
    category.is_active === false
  ) {
    addStoredInactiveCategory(
      category
    );
  }

  return category;
}


// =====================================================
// ACTIVATE CATEGORY - ADMIN
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
      response.data?.detail ||
        "Unable to activate category."
    );
  }

  const category =
    response.data as Category;

  removeStoredInactiveCategory(
    categoryId
  );

  return {
    ...category,
    is_active: true,
  };
}


// =====================================================
// DEACTIVATE CATEGORY - ADMIN
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
      response.data?.detail ||
        "Unable to deactivate category."
    );
  }

  const category =
    response.data as Category;

  const inactiveCategory: Category = {
    ...category,
    is_active: false,
  };

  addStoredInactiveCategory(
    inactiveCategory
  );

  return inactiveCategory;
}


// =====================================================
// DELETE CATEGORY - ADMIN
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
      response.data?.detail ||
        "Unable to delete category."
    );
  }

  removeStoredInactiveCategory(
    categoryId
  );
}