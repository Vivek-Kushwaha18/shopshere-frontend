"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import SearchBar from "./SearchBar";
import CategoryBar from "./CategoryBar";
import CartButtom from "./CartButtom";
import AccountMenu from "./AccountMenu";


interface User {
  id?: number;
  full_name?: string;
  email: string;
  phone?: string;
  role: "customer" | "seller" | "admin";
}

export default function Header() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem("user");
      }
    }
  }, []);

  return (
    <header className="bg-black text-white">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-4">
        <Link
          href="/"
          className="whitespace-nowrap text-2xl font-bold"
        >
          ShopSphere
        </Link>

        <div className="flex-1">
          <SearchBar />
        </div>

        <div className="flex items-center gap-5">
          {!user ? (
            <>
              <Link
                href="/login"
                className="font-semibold hover:text-yellow-300"
              >
                Login
              </Link>

              <Link
                href="/signup"
                className="font-semibold hover:text-yellow-300"
              >
                Signup
              </Link>
            </>
          ) : (
            <AccountMenu user={user} />
          )}

          <CartButtom />
        </div>
      </div>

      {/*<CategoryBar />*/}
    </header>
  );
}