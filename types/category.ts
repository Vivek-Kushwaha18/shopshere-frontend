export interface Category {
  id: number;
  name: string;
}

export interface CategoriesResponse {
  success: boolean;
  message: string;
  categories: Category[];
}

export interface CategoryResponse {
  success: boolean;
  message: string;
  category: Category;
}