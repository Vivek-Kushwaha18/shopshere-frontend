import { apiFetch } from "./api";

export function getCategories() {
  return apiFetch("/categories/");
}

export function getCategory(id: number) {
  return apiFetch(`/categories/${id}`);
}

export function createCategory(data: {
  name: string;
  description?: string;
}) {
  return apiFetch("/categories/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}