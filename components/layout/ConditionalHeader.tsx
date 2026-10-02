"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

import Header from "./Header";
import { getStoredUser, type User } from "@/services/auth";

export default function ConditionalHeader() {
  const pathname = usePathname();

  const [user, setUser] = useState<User | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    function loadUser() {
      const storedUser = getStoredUser();
      setUser(storedUser);
      setLoaded(true);
    }

    loadUser();

    window.addEventListener("auth-change", loadUser);

    return () => {
      window.removeEventListener("auth-change", loadUser);
    };
  }, []);

  if (!loaded) {
    return null;
  }

  // Admin uses AdminHeader from app/admin/layout.tsx.
  if (user?.role === "admin") {
    return null;
  }

  // Seller uses SellerHeader from app/seller/layout.tsx.
  if (user?.role === "seller") {
    return null;
  }

  // Admin routes have their own AdminHeader.
  if (pathname.startsWith("/admin")) {
    return null;
  }

  // Seller routes have their own SellerHeader.
  if (pathname.startsWith("/seller")) {
    return null;
  }

  return <Header />;
}