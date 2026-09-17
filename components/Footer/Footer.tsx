import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-16 border-t bg-gray-950 text-gray-300">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 md:grid-cols-4">
          {/* ShopSphere */}
          <div>
            <h2 className="text-xl font-bold text-white">
              ShopSphere
            </h2>

            <p className="mt-3 max-w-xs text-sm leading-6 text-gray-400">
              Smart shopping made simple. Discover products,
              explore categories, and shop with ease.
            </p>
          </div>

          {/* Shop */}
          <div>
            <h3 className="font-semibold text-white">
              Shop
            </h3>

            <div className="mt-4 flex flex-col gap-3 text-sm">
              <Link
                href="/products"
                className="transition hover:text-white"
              >
                All Products
              </Link>

              <Link
                href="/categories"
                className="transition hover:text-white"
              >
                Categories
              </Link>

              <Link
                href="/cart"
                className="transition hover:text-white"
              >
                Cart
              </Link>
            </div>
          </div>

          {/* Account */}
          <div>
            <h3 className="font-semibold text-white">
              Account
            </h3>

            <div className="mt-4 flex flex-col gap-3 text-sm">
              <Link
                href="/login"
                className="transition hover:text-white"
              >
                Login
              </Link>

              <Link
                href="/signup"
                className="transition hover:text-white"
              >
                Sign Up
              </Link>

              <Link
                href="/profile"
                className="transition hover:text-white"
              >
                My Profile
              </Link>
            </div>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold text-white">
              Support
            </h3>

            <div className="mt-4 flex flex-col gap-3 text-sm">
              <Link
                href="/contact"
                className="transition hover:text-white"
              >
                Contact Us
              </Link>

              <Link
                href="/about"
                className="transition hover:text-white"
              >
                About Us
              </Link>

              <Link
                href="/privacy"
                className="transition hover:text-white"
              >
                Privacy Policy
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-10 border-t border-gray-800 pt-6 text-center">
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} ShopSphere. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}