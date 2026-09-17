import { apiRequest } from "./api";

import {
  CategoriesResponse,
  CategoryResponse,
} from "@/types/category";

export async function getCategories(): Promise<CategoriesResponse> {
  return apiRequest("/categories/", {
    method: "GET",
  });
}

export async function getCategory(
  categoryId: number
): Promise<CategoryResponse> {
  return apiRequest(`/categories/${categoryId}`, {
    method: "GET",
  });
}