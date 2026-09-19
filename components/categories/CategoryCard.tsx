"use client";

import Link from "next/link";
import {
  ArrowRight,
  Laptop,
  Shirt,
  Home,
  Sparkles,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

export interface Category {
  id: number;
  name: string;
  description: string;
  icon: "electronics" | "fashion" | "home" | "beauty";
}

interface CategoryCardProps {
  category: Category;
}

const icons = {
  electronics: Laptop,
  fashion: Shirt,
  home: Home,
  beauty: Sparkles,
};

export default function CategoryCard({
  category,
}: CategoryCardProps) {
  const Icon = icons[category.icon];

  return (
    <Link href={`/products?category=${category.name}`}>
      <Card className="group h-full transition-all hover:-translate-y-1 hover:shadow-lg">
        <CardContent className="p-6">
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Icon className="h-7 w-7" />
          </div>

          <h2 className="text-xl font-semibold">
            {category.name}
          </h2>

          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {category.description}
          </p>

          <div className="mt-5 flex items-center text-sm font-medium text-primary">
            Explore Category
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}