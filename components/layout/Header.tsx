"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";

import {
  ShoppingCart,
  User,
  Menu,
  X,
  Search,
  LogOut,
  Package,
  Heart,
  Camera,
  ChevronDown,
  LayoutDashboard,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  clearAuthSession,
  getStoredUser,
} from "@/services/auth";

import {
  getCategories,
  type Category,
} from "@/services/categories";

interface UserData {
  id: number;
  full_name: string;
  email: string;
  phone?: string | null;
  role: "customer" | "seller" | "admin";
  is_active: boolean;
  is_verified: boolean;
}

export default function Header() {
  const pathname = usePathname();

  const [mobileMenu, setMobileMenu] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [mobileCategoriesOpen, setMobileCategoriesOpen] =
    useState(false);

  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] =
    useState(false);

  const [user, setUser] = useState<UserData | null>(null);
  const [search, setSearch] = useState("");

  const profileRef = useRef<HTMLDivElement>(null);
  const categoriesRef = useRef<HTMLDivElement>(null);

  function isActive(path: string) {
    if (path === "/") {
      return pathname === "/";
    }

    return (
      pathname === path ||
      pathname.startsWith(`${path}/`)
    );
  }

  useEffect(() => {
    function loadAuthUser() {
      const accessToken =
        localStorage.getItem("access_token");

      const storedUser = getStoredUser();

      if (accessToken && storedUser) {
        setIsLoggedIn(true);
        setUser(storedUser as UserData);
      } else {
        setIsLoggedIn(false);
        setUser(null);
      }
    }

    loadAuthUser();

    function handleAuthChange() {
      loadAuthUser();
    }

    window.addEventListener(
      "auth-change",
      handleAuthChange
    );

    return () => {
      window.removeEventListener(
        "auth-change",
        handleAuthChange
      );
    };
  }, []);

  useEffect(() => {
    async function loadCategories() {
      try {
        setCategoriesLoading(true);

        const result = await getCategories();

        setCategories(result);
      } catch (error) {
        console.error(
          "Header categories loading error:",
          error
        );

        setCategories([]);
      } finally {
        setCategoriesLoading(false);
      }
    }

    loadCategories();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;

      if (
        profileRef.current &&
        !profileRef.current.contains(target)
      ) {
        setProfileOpen(false);
      }

      if (
        categoriesRef.current &&
        !categoriesRef.current.contains(target)
      ) {
        setCategoriesOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  function handleLogout() {
    clearAuthSession();

    setIsLoggedIn(false);
    setUser(null);
    setProfileOpen(false);
    setCategoriesOpen(false);
    setMobileCategoriesOpen(false);
    setMobileMenu(false);

    window.location.href = "/";
  }

  function getInitials() {
    const name = user?.full_name?.trim();

    if (name) {
      const parts = name.split(/\s+/);

      if (parts.length >= 2) {
        return (
          parts[0][0] +
          parts[parts.length - 1][0]
        ).toUpperCase();
      }

      return parts[0][0].toUpperCase();
    }

    const email = user?.email?.trim();

    if (email) {
      return email[0].toUpperCase();
    }

    return "U";
  }

  function handleSearch(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const trimmedSearch = search.trim();

    if (!trimmedSearch) {
      window.location.href = "/products";
      return;
    }

    window.location.href =
      `/products?search=${encodeURIComponent(
        trimmedSearch
      )}`;
  }

  function closeMobileMenu() {
    setMobileMenu(false);
    setMobileCategoriesOpen(false);
  }

  function getDashboardUrl() {
    if (user?.role === "seller") {
      return "/seller/dashboard";
    }

    if (user?.role === "admin") {
      return "/admin/dashboard";
    }

    return "/";
  }

  function getDashboardLabel() {
    if (user?.role === "seller") {
      return "Seller Dashboard";
    }

    if (user?.role === "admin") {
      return "Admin Dashboard";
    }

    return "Dashboard";
  }

  return (
    <header className="sticky top-0 z-50 border-b bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4">
        {/* LOGO */}

        <Link
          href="/"
          className="flex shrink-0 items-center gap-2"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-black font-bold text-white">
            S
          </div>

          <div>
            <h1 className="text-xl font-bold leading-none">
              ShopSphere
            </h1>

            <p className="text-xs text-muted-foreground">
              Smart Shopping
            </p>
          </div>
        </Link>

        {/* DESKTOP NAVIGATION */}

        <nav className="hidden items-center gap-6 md:flex">
          <Link
            href="/"
            className={`relative pb-1 text-sm font-medium transition-colors ${
              isActive("/")
                ? "text-black"
                : "text-gray-600 hover:text-black"
            }`}
          >
            Home

            {isActive("/") && (
              <span className="absolute bottom-0 left-0 h-[2px] w-full rounded-full bg-black" />
            )}
          </Link>

          <Link
            href="/products"
            className={`relative pb-1 text-sm font-medium transition-colors ${
              isActive("/products")
                ? "text-black"
                : "text-gray-600 hover:text-black"
            }`}
          >
            Products

            {isActive("/products") && (
              <span className="absolute bottom-0 left-0 h-[2px] w-full rounded-full bg-black" />
            )}
          </Link>

          {/* CATEGORIES */}

          <div
            ref={categoriesRef}
            className="relative"
          >
            <button
              type="button"
              onClick={() =>
                setCategoriesOpen(
                  (previous) => !previous
                )
              }
              className={`relative flex items-center gap-1 pb-1 text-sm font-medium transition-colors ${
                isActive("/categories")
                  ? "text-black"
                  : "text-gray-600 hover:text-black"
              }`}
              aria-expanded={categoriesOpen}
              aria-haspopup="menu"
            >
              Categories

              <ChevronDown
                className={`h-4 w-4 transition-transform ${
                  categoriesOpen
                    ? "rotate-180"
                    : ""
                }`}
              />

              {isActive("/categories") && (
                <span className="absolute bottom-0 left-0 h-[2px] w-full rounded-full bg-black" />
              )}
            </button>

            {categoriesOpen && (
              <div className="absolute left-1/2 top-10 z-50 w-64 -translate-x-1/2 rounded-lg border bg-white p-2 shadow-xl">
                <div className="border-b px-3 py-2">
                  <p className="text-sm font-semibold text-gray-900">
                    Shop by Category
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    Select a category
                  </p>
                </div>

                <div className="max-h-80 overflow-y-auto py-1">
                  {categoriesLoading ? (
                    <div className="px-3 py-4 text-center text-sm text-gray-500">
                      Loading categories...
                    </div>
                  ) : categories.length === 0 ? (
                    <div className="px-3 py-4 text-center text-sm text-gray-500">
                      No categories available.
                    </div>
                  ) : (
                    categories.map((category) => (
                      <Link
                        key={category.id}
                        href={`/categories/${category.id}`}
                        onClick={() => {
                          setCategoriesOpen(false);
                        }}
                        className="flex items-center justify-between rounded-md px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-100 hover:text-black"
                      >
                        <span>{category.name}</span>

                        <span className="text-xs text-gray-400">
                          →
                        </span>
                      </Link>
                    ))
                  )}
                </div>

                <div className="border-t pt-1">
                  <Link
                    href="/categories"
                    onClick={() => {
                      setCategoriesOpen(false);
                    }}
                    className="block rounded-md px-3 py-2.5 text-sm font-medium text-gray-900 hover:bg-gray-100"
                  >
                    View all categories
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* AI ASSISTANT */}

          <Link
            href="/ai-assistant"
            className={`relative pb-1 text-sm font-medium transition-colors ${
              isActive("/ai-assistant")
                ? "text-black"
                : "text-gray-600 hover:text-black"
            }`}
          >
            AI Assistant

            {isActive("/ai-assistant") && (
              <span className="absolute bottom-0 left-0 h-[2px] w-full rounded-full bg-black" />
            )}
          </Link>
        </nav>

        {/* SEARCH */}

        <div className="hidden w-64 lg:block">
          <form
            onSubmit={handleSearch}
            className="relative"
          >
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />

            <Input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search products..."
              className="pl-9"
            />
          </form>
        </div>

        {/* DESKTOP ACTIONS */}

        <div className="hidden items-center gap-2 md:flex">
          <Button
            variant="ghost"
            size="icon"
            asChild
          >
            <Link href="/cart">
              <ShoppingCart className="h-5 w-5" />
            </Link>
          </Button>

          {!isLoggedIn ? (
            <>
              <Button
                variant="ghost"
                asChild
              >
                <Link href="/login">
                  Login
                </Link>
              </Button>

              <Button asChild>
                <Link href="/signup">
                  Sign Up
                </Link>
              </Button>
            </>
          ) : (
            <div
              ref={profileRef}
              className="relative"
            >
              <Button
                type="button"
                variant="ghost"
                onClick={() =>
                  setProfileOpen(
                    (previous) => !previous
                  )
                }
                className="gap-2"
              >
                <User className="h-4 w-4" />

                <span className="max-w-[140px] truncate">
                  {user?.full_name ||
                    user?.email ||
                    "Profile"}
                </span>
              </Button>

              {/* PROFILE DROPDOWN */}

              {profileOpen && (
                <div className="absolute right-0 top-12 z-50 w-72 rounded-lg border bg-white p-2 shadow-lg">
                  {/* USER INFO */}

                  <div className="flex items-center gap-3 px-3 py-3">
                    <button
                      type="button"
                      className="group relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border bg-gray-100 text-lg font-semibold uppercase"
                      aria-label="Profile photo"
                    >
                      {getInitials()}

                      <span className="absolute inset-0 flex items-center justify-center bg-black/50 text-white opacity-0 transition group-hover:opacity-100">
                        <Camera className="h-5 w-5" />
                      </span>
                    </button>

                    <div className="min-w-0">
                      <p className="truncate font-semibold">
                        {user?.full_name ||
                          "User"}
                      </p>

                      <p className="truncate text-sm text-gray-500">
                        {user?.email}
                      </p>

                      <p className="mt-1 text-xs font-medium capitalize text-gray-400">
                        {user?.role ||
                          "customer"}
                      </p>
                    </div>
                  </div>

                  <div className="my-1 border-t" />

                  {/* DASHBOARD - SELLER / ADMIN ONLY */}

                  {(user?.role === "seller" ||
                    user?.role === "admin") && (
                    <Link
                      href={getDashboardUrl()}
                      onClick={() =>
                        setProfileOpen(false)
                      }
                      className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-black hover:bg-gray-100"
                    >
                      <LayoutDashboard className="h-4 w-4" />

                      {getDashboardLabel()}
                    </Link>
                  )}

                  {/* ORDERS */}

                  <Link
                    href="/orders"
                    onClick={() =>
                      setProfileOpen(false)
                    }
                    className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-gray-100"
                  >
                    <Package className="h-4 w-4" />
                    My Orders
                  </Link>

                  {/* WISHLIST */}

                  <Link
                    href="/wishlist"
                    onClick={() =>
                      setProfileOpen(false)
                    }
                    className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-gray-100"
                  >
                    <Heart className="h-4 w-4" />
                    Wishlist
                  </Link>

                  <div className="my-1 border-t" />

                  {/* LOGOUT */}

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* MOBILE BUTTON */}

        <button
          type="button"
          className="md:hidden"
          onClick={() =>
            setMobileMenu(
              (previous) => !previous
            )
          }
          aria-label="Toggle menu"
        >
          {mobileMenu ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* MOBILE MENU */}

      {mobileMenu && (
        <div className="border-t bg-white px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-4">
            <Link
              href="/"
              onClick={closeMobileMenu}
              className={`text-sm font-medium ${
                isActive("/")
                  ? "text-black"
                  : "text-gray-600"
              }`}
            >
              Home
            </Link>

            <Link
              href="/products"
              onClick={closeMobileMenu}
              className={`text-sm font-medium ${
                isActive("/products")
                  ? "text-black"
                  : "text-gray-600"
              }`}
            >
              Products
            </Link>

            {/* MOBILE CATEGORIES */}

            <div>
              <button
                type="button"
                onClick={() =>
                  setMobileCategoriesOpen(
                    (previous) => !previous
                  )
                }
                className={`flex w-full items-center justify-between text-left text-sm font-medium ${
                  isActive("/categories")
                    ? "text-black"
                    : "text-gray-600"
                }`}
              >
                <span>
                  Categories
                </span>

                <ChevronDown
                  className={`h-4 w-4 transition-transform ${
                    mobileCategoriesOpen
                      ? "rotate-180"
                      : ""
                  }`}
                />
              </button>

              {mobileCategoriesOpen && (
                <div className="mt-3 rounded-lg border bg-gray-50 p-2">
                  {categoriesLoading ? (
                    <p className="px-3 py-2 text-sm text-gray-500">
                      Loading categories...
                    </p>
                  ) : categories.length === 0 ? (
                    <p className="px-3 py-2 text-sm text-gray-500">
                      No categories available.
                    </p>
                  ) : (
                    categories.map((category) => (
                      <Link
                        key={category.id}
                        href={`/categories/${category.id}`}
                        onClick={closeMobileMenu}
                        className="flex items-center justify-between rounded-md px-3 py-2.5 text-sm hover:bg-white"
                      >
                        <span>
                          {category.name}
                        </span>

                        <span className="text-xs text-gray-400">
                          →
                        </span>
                      </Link>
                    ))
                  )}

                  <div className="mt-1 border-t pt-1">
                    <Link
                      href="/categories"
                      onClick={closeMobileMenu}
                      className="block rounded-md px-3 py-2.5 text-sm font-medium hover:bg-white"
                    >
                      View all categories
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <Link
              href="/ai-assistant"
              onClick={closeMobileMenu}
              className={`text-sm font-medium ${
                isActive("/ai-assistant")
                  ? "text-black"
                  : "text-gray-600"
              }`}
            >
              AI Assistant
            </Link>

            <Link
              href="/cart"
              onClick={closeMobileMenu}
              className="flex items-center gap-2 text-sm font-medium"
            >
              <ShoppingCart className="h-4 w-4" />
              Cart
            </Link>

            {!isLoggedIn ? (
              <>
                <Link
                  href="/login"
                  onClick={closeMobileMenu}
                  className="text-sm font-medium"
                >
                  Login
                </Link>

                <Link
                  href="/signup"
                  onClick={closeMobileMenu}
                  className="text-sm font-medium"
                >
                  Sign Up
                </Link>
              </>
            ) : (
              <>
                {/* MOBILE USER */}

                <div className="border-t pt-4">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      className="group relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border bg-gray-100 text-lg font-semibold uppercase"
                      aria-label="Profile photo"
                    >
                      {getInitials()}

                      <span className="absolute inset-0 flex items-center justify-center bg-black/50 text-white opacity-0 transition group-hover:opacity-100">
                        <Camera className="h-5 w-5" />
                      </span>
                    </button>

                    <div className="min-w-0">
                      <p className="truncate font-semibold">
                        {user?.full_name ||
                          "User"}
                      </p>

                      <p className="truncate text-sm text-gray-500">
                        {user?.email}
                      </p>

                      <p className="mt-1 text-xs font-medium capitalize text-gray-400">
                        {user?.role ||
                          "customer"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* DASHBOARD - SELLER / ADMIN ONLY */}

                {(user?.role === "seller" ||
                  user?.role === "admin") && (
                  <Link
                    href={getDashboardUrl()}
                    onClick={closeMobileMenu}
                    className="flex items-center gap-2 text-sm font-medium text-black"
                  >
                    <LayoutDashboard className="h-4 w-4" />

                    {getDashboardLabel()}
                  </Link>
                )}

                <Link
                  href="/orders"
                  onClick={closeMobileMenu}
                  className="flex items-center gap-2 text-sm font-medium"
                >
                  <Package className="h-4 w-4" />
                  My Orders
                </Link>

                <Link
                  href="/wishlist"
                  onClick={closeMobileMenu}
                  className="flex items-center gap-2 text-sm font-medium"
                >
                  <Heart className="h-4 w-4" />
                  Wishlist
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-left text-sm font-medium text-red-600"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}