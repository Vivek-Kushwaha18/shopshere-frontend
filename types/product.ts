export interface Product {
  id: number;
  seller_id: number;
  category_id: number;
  name: string;
  description?: string | null;
  price: number;
  original_price?: number | null;
  stock: number;
  image_url?: string | null;
  is_deleted?: boolean;
  created_at?: string;
  updated_at?: string;
}