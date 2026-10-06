"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Boxes,
  UserCircle,
  LogOut,
  ChevronDown,
  Wallet,
  LineChart,
  Truck,
} from "lucide-react";
import Swal from "sweetalert2";

import {
  clearAuthSession,
  getStoredUser,
  type User,
} from "@/services/auth";

export default function SellerHeader() {
  const router = useRouter();
  const pathname = usePathname();

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
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
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

  function isActive(path: string) {
    if (path === "/seller/dashboard") {
      return pathname === path;
    }

    return pathname.startsWith(path);
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
            className={`relative flex items-center gap-2 py-1 text-sm font-medium transition ${
              isActive("/seller/dashboard")
                ? "text-black"
                : "text-gray-700 hover:text-black"
            }`}
          >
            <LayoutDashboard className="h-4 w-4" />

            Dashboard

            {isActive("/seller/dashboard") && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-black" />
            )}
          </Link>

          {/* Products */}

          <Link
            href="/seller/dashboard/products"
            className={`relative flex items-center gap-2 py-1 text-sm font-medium transition ${
              isActive("/seller/dashboard/products")
                ? "text-black"
                : "text-gray-700 hover:text-black"
            }`}
          >
            <Package className="h-4 w-4" />

            Products

            {isActive("/seller/dashboard/products") && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-black" />
            )}
          </Link>

          {/* Revenue */}

          <Link
            href="/seller/dashboard/revenue"
            className={`relative flex items-center gap-2 py-1 text-sm font-medium transition ${
              isActive("/seller/dashboard/revenue")
                ? "text-black"
                : "text-gray-700 hover:text-black"
            }`}
          >
            <Wallet className="h-4 w-4" />

            Revenue

            {isActive("/seller/dashboard/revenue") && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-black" />
            )}
          </Link>

          {/* Inventory */}

          <Link
            href="/seller/dashboard/inventory"
            className={`relative flex items-center gap-2 py-1 text-sm font-medium transition ${
              isActive("/seller/dashboard/inventory")
                ? "text-black"
                : "text-gray-700 hover:text-black"
            }`}
          >
            <Boxes className="h-4 w-4" />

            Inventory

            {isActive("/seller/dashboard/inventory") && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-black" />
            )}
          </Link>

          {/* Orders */}

          <Link
            href="/seller/dashboard/orders"
            className={`relative flex items-center gap-2 py-1 text-sm font-medium transition ${
              isActive("/seller/dashboard/orders")
                ? "text-black"
                : "text-gray-700 hover:text-black"
            }`}
          >
            <ShoppingBag className="h-4 w-4" />

            Orders

            {isActive("/seller/dashboard/orders") && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-black" />
            )}
          </Link>

          {/* Shipments */}

          <Link
            href="/seller/dashboard/shipments"
            className={`relative flex items-center gap-2 py-1 text-sm font-medium transition ${
              isActive("/seller/dashboard/shipments")
                ? "text-black"
                : "text-gray-700 hover:text-black"
            }`}
          >
            <Truck className="h-4 w-4" />

            Shipments

            {isActive("/seller/dashboard/shipments") && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-black" />
            )}
          </Link>

          {/* Analytics */}

          <Link
            href="/seller/dashboard/analytics"
            className={`relative flex items-center gap-2 py-1 text-sm font-medium transition ${
              isActive("/seller/dashboard/analytics")
                ? "text-black"
                : "text-gray-700 hover:text-black"
            }`}
          >
            <LineChart className="h-4 w-4" />

            Analytics

            {isActive("/seller/dashboard/analytics") && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-black" />
            )}
          </Link>

          {/* Profile */}

          <div
            className="relative"
            ref={profileRef}
          >
            <button
              type="button"
              onClick={() =>
                setProfileOpen(
                  (prev) => !prev
                )
              }
              className={`relative flex items-center gap-2 py-1 text-sm font-medium ${
                pathname ===
                "/seller/dashboard/profile"
                  ? "text-black"
                  : "text-gray-700 hover:text-black"
              }`}
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

              {pathname ===
                "/seller/dashboard/profile" && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-black" />
              )}
            </button>

            {/* Profile Dropdown */}

            {profileOpen && (
              <div className="absolute right-0 top-full z-50 mt-3 w-56 rounded-lg border bg-white py-2 shadow-lg">
                <div className="border-b px-4 py-3">
                  <p className="text-sm font-semibold text-gray-900">
                    {user?.full_name ||
                      "Seller"}
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