export interface ProductImage {
  id: number;
  image_url: string;
}

export interface Product {
  id: number;
  seller_id: number;
  category_id: number;
  name: string;
  description: string;
  price: number;
  quantity: number;
  category: string;
  image_url: string | null;
  images?: ProductImage[];
}

export interface ProductsResponse {
  success: boolean;
  message: string;
  products: Product[];
}

export interface ProductResponse {
  success: boolean;
  message: string;
  product: Product;
}