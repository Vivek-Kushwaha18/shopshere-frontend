"use client";

import CategoryCard, {
  Category,
} from "@/components/categories/CategoryCard";

const categories: Category[] = [
  {
    id: 1,
    name: "Electronics",
    description:
      "Discover phones, laptops, headphones, smart devices and more.",
    icon: "electronics",
  },
  {
    id: 2,
    name: "Fashion",
    description:
      "Explore clothing, shoes, bags and accessories for every style.",
    icon: "fashion",
  },
  {
    id: 3,
    name: "Home & Living",
    description:
      "Make your home better with furniture, decor, lighting and essentials.",
    icon: "home",
  },
  {
    id: 4,
    name: "Beauty",
    description:
      "Find skincare, makeup, personal care and beauty essentials.",
    icon: "beauty",
  },
];

export default function CategoriesPage() {
  return (
    <div className="min-h-screen bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Shop by Category
          </h1>

          <p className="mt-3 text-muted-foreground">
            Explore our collection and find products
            that match your needs.
          </p>
        </div>

        {/* Categories */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
            />
          ))}
        </div>
      </div>
    </div>
  );
}