import { apiFetch } from "./api";

export function getProducts() {
  return apiFetch("/products/");
}

export function getProduct(id: number) {
  return apiFetch(`/products/${id}`);
}

export function createProduct(data: {
  name: string;
  description?: string;
  price: number;
  stock: number;
  category_id: number;
}) {
  return apiFetch("/products/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}