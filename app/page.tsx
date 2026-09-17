import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gray-50">

      {/* Hero Section */}
      <section className="bg-white">
        <div className="mx-auto flex max-w-7xl flex-col items-center px-4 py-20 text-center">

          <p className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500">
            Smart Shopping
          </p>

          <h1 className="max-w-4xl text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
            Welcome to ShopSphere
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-gray-600">
            Discover products from different categories and
            find what you need with a smarter shopping experience.
          </p>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row">

            <Link
              href="/products"
              className="rounded-md bg-black px-6 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
            >
              Explore Products
            </Link>

            <Link
              href="/signup"
              className="rounded-md border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-900 transition hover:bg-gray-100"
            >
              Create Account
            </Link>

          </div>

        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-4 py-16">

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">

          <div className="rounded-lg border bg-white p-6">
            <div className="mb-4 text-3xl">
              🛍️
            </div>

            <h2 className="text-lg font-semibold">
              Wide Product Selection
            </h2>

            <p className="mt-2 text-sm leading-6 text-gray-600">
              Browse products across different categories
              and discover something that fits your needs.
            </p>
          </div>

          <div className="rounded-lg border bg-white p-6">
            <div className="mb-4 text-3xl">
              🔎
            </div>

            <h2 className="text-lg font-semibold">
              Easy Discovery
            </h2>

            <p className="mt-2 text-sm leading-6 text-gray-600">
              Explore categories and quickly find the products
              you are looking for.
            </p>
          </div>

          <div className="rounded-lg border bg-white p-6">
            <div className="mb-4 text-3xl">
              🤖
            </div>

            <h2 className="text-lg font-semibold">
              Smart Shopping
            </h2>

            <p className="mt-2 text-sm leading-6 text-gray-600">
              ShopSphere is designed to provide a smarter
              and easier shopping experience.
            </p>
          </div>

        </div>

      </section>

      {/* CTA */}
      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 text-center">

          <h2 className="text-3xl font-bold text-gray-900">
            Ready to start shopping?
          </h2>

          <p className="mx-auto mt-3 max-w-xl text-gray-600">
            Explore our products and discover what ShopSphere
            has to offer.
          </p>

          <Link
            href="/products"
            className="mt-6 inline-block rounded-md bg-black px-6 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
          >
            Browse Products
          </Link>

        </div>
      </section>

    </main>
  );
}