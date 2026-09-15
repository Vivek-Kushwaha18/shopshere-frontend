"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Header() {
  const pathname = usePathname();

  const links = [
    { name: "Home", href: "/" },
    { name: "Login", href: "/login" },
    { name: "Signup", href: "/signup" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="flex flex-col">
          <span className="text-xl font-bold text-gray-900">
            ShopSphere
          </span>
          <span className="text-xs text-gray-500">
            Smart Shopping
          </span>
        </Link>

        <nav className="flex items-center gap-6">
          {links.map((link) => {
            const active = pathname === link.href;

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative py-2 text-sm font-medium transition ${
                  active
                    ? "text-black after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:bg-black"
                    : "text-gray-600 hover:text-black"
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}