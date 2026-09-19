
import Link from "next/link";
import {
  ArrowRight,
  Bot,
  Search,
  ShoppingBag,
  Sparkles,
  Truck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const categories = [
  {
    name: "Electronics",
    description: "Phones, laptops, accessories and more",
    icon: "💻",
  },
  {
    name: "Fashion",
    description: "Clothing, shoes and accessories",
    icon: "👕",
  },
  {
    name: "Home & Living",
    description: "Furniture, decor and essentials",
    icon: "🏠",
  },
  {
    name: "Beauty",
    description: "Skincare, makeup and personal care",
    icon: "✨",
  },
];

const features = [
  {
    icon: Bot,
    title: "AI Shopping Assistant",
    description:
      "Find products, compare options and get personalized shopping help.",
  },
  {
    icon: ShoppingBag,
    title: "Everything in One Place",
    description:
      "Discover products from multiple sellers across different categories.",
  },
  {
    icon: Truck,
    title: "Easy Order Tracking",
    description:
      "Track your orders and stay updated from checkout to delivery.",
  },
];

export default function Home() {
  return (
    <div>
      {/* Hero Section */}
      <section className="border-b bg-gradient-to-b from-muted/50 to-background">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:py-24 lg:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-background px-4 py-2 text-sm">
              <Sparkles className="h-4 w-4" />
              <span>AI-Powered Smart Shopping</span>
            </div>

            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Shop smarter with{" "}
              <span className="underline decoration-2 underline-offset-8">
                ShopSphere
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
              Discover products, compare options and get personalized
              recommendations with your AI shopping assistant.
            </p>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button size="lg" asChild>
                <Link href="/products">
                  Explore Products
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>

              <Button size="lg" variant="outline" asChild>
                <Link href="/ai-assistant">
                  <Bot className="mr-2 h-4 w-4" />
                  Ask AI Assistant
                </Link>
              </Button>
            </div>

            {/* Search */}
            <div className="mx-auto mt-10 max-w-xl">
              <div className="flex items-center rounded-lg border bg-background p-1 shadow-sm">
                <Search className="ml-3 h-5 w-5 text-muted-foreground" />

                <input
                  type="text"
                  placeholder="What are you looking for?"
                  className="h-11 flex-1 bg-transparent px-3 text-sm outline-none"
                />

                <Button>Search</Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="text-sm font-medium">Explore</p>

            <h2 className="mt-1 text-3xl font-bold">
              Shop by Category
            </h2>
          </div>

          <Button variant="ghost" asChild>
            <Link href="/categories">
              View all
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((category) => (
            <Link
              href="/categories"
              key={category.name}
              className="group"
            >
              <Card className="h-full transition-shadow group-hover:shadow-md">
                <CardContent className="p-6">
                  <div className="mb-5 text-4xl">
                    {category.icon}
                  </div>

                  <h3 className="text-lg font-semibold">
                    {category.name}
                  </h3>

                  <p className="mt-2 text-sm text-muted-foreground">
                    {category.description}
                  </p>

                  <div className="mt-5 flex items-center text-sm font-medium">
                    Explore
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="border-y bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-16">
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <h2 className="text-3xl font-bold">
              A smarter way to shop
            </h2>

            <p className="mt-3 text-muted-foreground">
              ShopSphere combines e-commerce with AI to make
              finding the right products easier.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;

              return (
                <Card key={feature.title}>
                  <CardContent className="p-6">
                    <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-lg border bg-background">
                      <Icon className="h-5 w-5" />
                    </div>

                    <h3 className="text-lg font-semibold">
                      {feature.title}
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 py-20">
        <div className="rounded-2xl border bg-muted/40 px-6 py-12 text-center sm:px-12">
          <Sparkles className="mx-auto h-8 w-8" />

          <h2 className="mt-5 text-3xl font-bold">
            Need help finding something?
          </h2>

          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Tell our AI shopping assistant what you need and
            let it help you discover the right products.
          </p>

          <Button className="mt-7" size="lg" asChild>
            <Link href="/ai-assistant">
              Start Shopping with AI
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
