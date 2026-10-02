"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Boxes,
  BarChart3,
  UserCircle,
  LogOut,
  ChevronDown,
  Wallet,
  LineChart,
} from "lucide-react";
import Swal from "sweetalert2";

import {
  clearAuthSession,
  getStoredUser,
  type User,
} from "@/services/auth";

export default function SellerHeader() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function loadUser() {
      const storedUser = getStoredUser();
      setUser(storedUser);
    }

    loadUser();

    window.addEventListener("auth-change", loadUser);

    return () => {
      window.removeEventListener("auth-change", loadUser);
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setProfileOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  function handleLogout() {
    setProfileOpen(false);

    clearAuthSession();

    Swal.fire({
      icon: "success",
      title: "Logged out",
      text: "You have been logged out successfully.",
      timer: 1200,
      showConfirmButton: false,
    }).then(() => {
      router.push("/login");
    });
  }

  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        {/* Logo */}

        <Link
          href="/seller/dashboard"
          className="text-xl font-bold text-gray-900"
        >
          ShopSphere Seller
        </Link>

        {/* Navigation */}

        <nav className="flex items-center gap-6">
          {/* Dashboard */}

          <Link
            href="/seller/dashboard"
            className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-black"
          >
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Link>

          {/* Products */}

          <Link
            href="/seller/dashboard/products"
            className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-black"
          >
            <Package className="h-4 w-4" />
            Products
          </Link>

          {/* Revenue */}

          <Link
            href="/seller/dashboard/revenue"
            className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-black"
          >
            <Wallet className="h-4 w-4" />
            Revenue
          </Link>

          {/* Inventory */}

          <Link
            href="/seller/dashboard/inventory"
            className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-black"
          >
            <Boxes className="h-4 w-4" />
            Inventory
          </Link>

          {/* Orders */}

          <Link
            href="/seller/dashboard/orders"
            className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-black"
          >
            <ShoppingBag className="h-4 w-4" />
            Orders
          </Link>

          {/* Analytics */}

          <Link
            href="/seller/dashboard/analytics"
            className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-black"
          >
            <LineChart className="h-4 w-4" />
            Analytics
          </Link>

          {/* Profile */}

          <div
            className="relative"
            ref={profileRef}
          >
            <button
              type="button"
              onClick={() =>
                setProfileOpen((prev) => !prev)
              }
              className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-black"
            >
              <UserCircle className="h-5 w-5" />

              <span>
                {user?.full_name || "Seller"}
              </span>

              <ChevronDown
                className={`h-4 w-4 transition-transform ${
                  profileOpen
                    ? "rotate-180"
                    : ""
                }`}
              />
            </button>

            {/* Profile Dropdown */}

            {profileOpen && (
              <div className="absolute right-0 top-full z-50 mt-3 w-56 rounded-lg border bg-white py-2 shadow-lg">
                <div className="border-b px-4 py-3">
                  <p className="text-sm font-semibold text-gray-900">
                    {user?.full_name || "Seller"}
                  </p>

                  <p className="mt-1 truncate text-xs text-gray-500">
                    {user?.email || ""}
                  </p>

                  <p className="mt-1 text-xs font-medium capitalize text-gray-500">
                    {user?.role || "seller"}
                  </p>
                </div>

                {/* Profile */}

                <Link
                  href="/seller/dashboard/profile"
                  onClick={() =>
                    setProfileOpen(false)
                  }
                  className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <UserCircle className="h-4 w-4" />
                  Profile
                </Link>

                {/* Logout */}

                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}