export default function Footer() {
  return (
    <footer className="border-t bg-gray-50">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div>
            <h2 className="font-bold text-gray-900">
              ShopSphere
            </h2>

            <p className="text-sm text-gray-500">
              Smart Shopping Platform
            </p>
          </div>

          <div className="flex gap-5 text-sm text-gray-600">
            <span className="cursor-pointer hover:text-black">
              About
            </span>

            <span className="cursor-pointer hover:text-black">
              Contact
            </span>

            <span className="cursor-pointer hover:text-black">
              Privacy
            </span>

            <span className="cursor-pointer hover:text-black">
              Terms
            </span>
          </div>
        </div>

        <div className="mt-6 border-t pt-5 text-center text-sm text-gray-500">
          © 2026 ShopSphere. All rights reserved.
        </div>
      </div>
    </footer>
  );
}