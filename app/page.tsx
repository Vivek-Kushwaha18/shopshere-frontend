import Link from "next/link";

export default function Home() {
  return (
    <div>
      <section className="bg-gray-50">
        <div className="mx-auto flex min-h-[550px] max-w-7xl flex-col items-center justify-center px-6 text-center">
          <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-gray-500">
            Smart Shopping Platform
          </p>

          <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-gray-900 md:text-6xl">
            Welcome to ShopSphere
          </h1>

          <p className="mt-6 max-w-2xl text-lg text-gray-600">
            Discover products, get smarter recommendations, and enjoy
            a better shopping experience.
          </p>

          <div className="mt-8 flex gap-4">
            <Link
              href="/signup"
              className="rounded-lg bg-black px-6 py-3 font-medium text-white transition hover:bg-gray-800"
            >
              Create Account
            </Link>

            <Link
              href="/login"
              className="rounded-lg border border-gray-300 bg-white px-6 py-3 font-medium text-gray-900 transition hover:bg-gray-100"
            >
              Login
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-xl border p-6">
            <h2 className="text-xl font-semibold">
              Smart Shopping
            </h2>

            <p className="mt-3 text-gray-600">
              Find the products you need quickly and easily.
            </p>
          </div>

          <div className="rounded-xl border p-6">
            <h2 className="text-xl font-semibold">
              AI Assistance
            </h2>

            <p className="mt-3 text-gray-600">
              Get intelligent recommendations for your shopping.
            </p>
          </div>

          <div className="rounded-xl border p-6">
            <h2 className="text-xl font-semibold">
              Secure Account
            </h2>

            <p className="mt-3 text-gray-600">
              Manage your account securely with authentication.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}