import { apiRequest } from "./api";
import {
  ProductsResponse,
  ProductResponse,
} from "@/types/product";

/* =========================
   GET ALL PRODUCTS
========================= */

export async function getProducts(): Promise<ProductsResponse> {
  return apiRequest("/products/", {
    method: "GET",
  });
}

/* =========================
   GET PRODUCTS BY CATEGORY
========================= */

export async function getProductsByCategory(
  categoryId: number
): Promise<ProductsResponse> {
  return apiRequest(`/products/category/${categoryId}`, {
    method: "GET",
  });
}

/* =========================
   GET SINGLE PRODUCT
========================= */

export async function getProduct(
  productId: number
): Promise<ProductResponse> {
  return apiRequest(`/products/${productId}`, {
    method: "GET",
  });
}