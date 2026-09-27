"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
  ChevronDown,
  LayoutDashboard,
  ShieldCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  clearAuthSession,
  getStoredUser,
  type User as AuthUser,
} from "@/services/auth";

import {
  getCategories,
  type Category,
} from "@/services/categories";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();

  const [mobileMenu, setMobileMenu] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] =
    useState(false);
  const [mobileCategoriesOpen, setMobileCategoriesOpen] =
    useState(false);

  const [categories, setCategories] =
    useState<Category[]>([]);

  const [categoriesLoading, setCategoriesLoading] =
    useState(false);

  const [user, setUser] = useState<AuthUser | null>(null);
  const [search, setSearch] = useState("");

  const profileRef =
    useRef<HTMLDivElement>(null);

  const categoriesRef =
    useRef<HTMLDivElement>(null);

  // =====================================================
  // ACTIVE ROUTE
  // =====================================================

  function isActive(path: string) {
    if (path === "/") {
      return pathname === "/";
    }

    return (
      pathname === path ||
      pathname.startsWith(`${path}/`)
    );
  }

  // =====================================================
  // LOAD AUTH USER
  // =====================================================

  useEffect(() => {
    function loadAuthUser() {
      const accessToken =
        localStorage.getItem("access_token");

      const storedUser = getStoredUser();

      if (accessToken && storedUser) {
        setIsLoggedIn(true);
        setUser(storedUser);
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

  // =====================================================
  // LOAD CATEGORIES
  // =====================================================

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

  // =====================================================
  // CLOSE DROPDOWNS WHEN CLICKING OUTSIDE
  // =====================================================

  useEffect(() => {
    function handleClickOutside(
      event: MouseEvent
    ) {
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

  // =====================================================
  // LOGOUT
  // =====================================================

  function handleLogout() {
    clearAuthSession();

    setIsLoggedIn(false);
    setUser(null);

    setProfileOpen(false);
    setCategoriesOpen(false);
    setMobileCategoriesOpen(false);
    setMobileMenu(false);

    router.push("/");
  }

  // =====================================================
  // USER INITIALS
  // =====================================================

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

  // =====================================================
  // ROLE LABEL
  // =====================================================

  function getRoleLabel() {
    if (user?.role === "seller") {
      return "Seller";
    }

    if (user?.role === "admin") {
      return "Admin";
    }

    return "Customer";
  }

  // =====================================================
  // DASHBOARD URL
  // =====================================================

  function getDashboardUrl() {
    if (user?.role === "seller") {
      return "/seller/dashboard";
    }

    if (user?.role === "admin") {
      return "/admin/dashboard";
    }

    return "/";
  }

  // =====================================================
  // DASHBOARD LABEL
  // =====================================================

  function getDashboardLabel() {
    if (user?.role === "seller") {
      return "Seller Dashboard";
    }

    if (user?.role === "admin") {
      return "Admin Dashboard";
    }

    return "Dashboard";
  }

  // =====================================================
  // SEARCH
  // =====================================================

  function handleSearch(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const trimmedSearch = search.trim();

    if (!trimmedSearch) {
      router.push("/products");
      return;
    }

    router.push(
      `/products?search=${encodeURIComponent(
        trimmedSearch
      )}`
    );
  }

  // =====================================================
  // CLOSE MOBILE MENU
  // =====================================================

  function closeMobileMenu() {
    setMobileMenu(false);
    setMobileCategoriesOpen(false);
    setCategoriesOpen(false);
  }

  return (
    <header className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4">

        {/* =================================================
            LOGO
        ================================================= */}

        <Link
          href="/"
          className="flex shrink-0 items-center gap-2"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-black text-lg font-bold text-white">
            S
          </div>

          <div className="hidden sm:block">
            <h1 className="text-xl font-bold leading-none">
              ShopSphere
            </h1>

            <p className="mt-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              Smart Shopping
            </p>
          </div>
        </Link>

        {/* =================================================
            DESKTOP NAVIGATION
        ================================================= */}

        <nav className="hidden items-center gap-6 md:flex">
          {/* HOME */}

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

          {/* PRODUCTS */}

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
              <div className="absolute left-1/2 top-10 z-50 w-72 -translate-x-1/2 overflow-hidden rounded-xl border bg-white shadow-xl">

                <div className="border-b px-4 py-3">
                  <p className="text-sm font-semibold text-gray-900">
                    Shop by Category
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    Discover products by category
                  </p>
                </div>

                <div className="max-h-80 overflow-y-auto p-2">
                  {categoriesLoading ? (
                    <div className="px-3 py-6 text-center text-sm text-gray-500">
                      Loading categories...
                    </div>
                  ) : categories.length === 0 ? (
                    <div className="px-3 py-6 text-center text-sm text-gray-500">
                      No categories available.
                    </div>
                  ) : (
                    categories.map((category) => (
                      <Link
                        key={category.id}
                        href={`/categories/${category.id}`}
                        onClick={() =>
                          setCategoriesOpen(false)
                        }
                        className="group flex items-center justify-between rounded-lg px-3 py-2.5 text-sm text-gray-700 transition hover:bg-gray-100 hover:text-black"
                      >
                        <span className="font-medium">
                          {category.name}
                        </span>

                        <span className="text-gray-400 transition-transform group-hover:translate-x-1">
                          →
                        </span>
                      </Link>
                    ))
                  )}
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

        {/* =================================================
            SEARCH
        ================================================= */}

        <div className="hidden w-56 lg:block xl:w-64">
          <form
            onSubmit={handleSearch}
            className="relative"
          >
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

            <Input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search products..."
              className="h-9 rounded-lg pl-9"
            />
          </form>
        </div>

        {/* =================================================
            DESKTOP ACTIONS
        ================================================= */}

        <div className="hidden items-center gap-1 md:flex">

          {/* CART */}

          <Button
            variant="ghost"
            size="icon"
            asChild
            className="rounded-full"
          >
            <Link href="/cart">
              <ShoppingCart className="h-5 w-5" />
              <span className="sr-only">
                Shopping cart
              </span>
            </Link>
          </Button>

          {!isLoggedIn ? (
            <>
              {/* LOGIN */}

              <Button
                variant="ghost"
                size="sm"
                asChild
              >
                <Link href="/login">
                  Login
                </Link>
              </Button>

              {/* SIGN UP */}

              <Button
                size="sm"
                asChild
                className="rounded-lg"
              >
                <Link href="/signup">
                  Sign Up
                </Link>
              </Button>
            </>
          ) : (
            <div
              ref={profileRef}
              className="relative ml-1"
            >
              {/* PROFILE BUTTON */}

              <Button
                type="button"
                variant="ghost"
                onClick={() =>
                  setProfileOpen(
                    (previous) => !previous
                  )
                }
                className="h-auto gap-2 rounded-full px-2 py-1.5"
                aria-expanded={profileOpen}
                aria-haspopup="menu"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-900 text-xs font-semibold text-white">
                  {getInitials()}
                </span>

                <span className="hidden max-w-[120px] truncate text-sm font-medium lg:block">
                  {user?.full_name ||
                    user?.email ||
                    "Profile"}
                </span>

                <ChevronDown
                  className={`h-4 w-4 text-gray-500 transition-transform ${
                    profileOpen
                      ? "rotate-180"
                      : ""
                  }`}
                />
              </Button>

              {/* PROFILE DROPDOWN */}

              {profileOpen && (
                <div className="absolute right-0 top-12 z-50 w-80 overflow-hidden rounded-xl border bg-white shadow-2xl">

                  {/* USER HEADER */}

                  <div className="bg-gray-50 px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gray-900 text-sm font-bold text-white">
                        {getInitials()}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate font-semibold text-gray-900">
                          {user?.full_name ||
                            "User"}
                        </p>

                        <p className="truncate text-xs text-gray-500">
                          {user?.email}
                        </p>

                        <div className="mt-1 flex items-center gap-2">
                          <span className="rounded-full bg-gray-200 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-700">
                            {getRoleLabel()}
                          </span>

                          {user?.is_verified && (
                            <span className="flex items-center gap-1 text-[10px] font-medium text-green-600">
                              <ShieldCheck className="h-3 w-3" />
                              Verified
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-2">

                    {/* PROFILE */}

                    <Link
                      href="/profile"
                      onClick={() =>
                        setProfileOpen(false)
                      }
                      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                        isActive("/profile")
                          ? "bg-gray-100 font-semibold text-black"
                          : "text-gray-700 hover:bg-gray-100 hover:text-black"
                      }`}
                    >
                      <User className="h-4 w-4" />

                      <div>
                        <p className="font-medium">
                          My Profile
                        </p>

                        <p className="text-xs text-gray-400">
                          Manage your account
                        </p>
                      </div>
                    </Link>

                    {/* DASHBOARD */}

                    {(user?.role === "seller" ||
                      user?.role === "admin") && (
                      <Link
                        href={getDashboardUrl()}
                        onClick={() =>
                          setProfileOpen(false)
                        }
                        className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-gray-700 transition hover:bg-gray-100 hover:text-black"
                      >
                        <LayoutDashboard className="h-4 w-4" />

                        <div>
                          <p className="font-medium">
                            {getDashboardLabel()}
                          </p>

                          <p className="text-xs text-gray-400">
                            Manage your workspace
                          </p>
                        </div>
                      </Link>
                    )}

                    {/* ORDERS */}

                    <Link
                      href="/orders"
                      onClick={() =>
                        setProfileOpen(false)
                      }
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-gray-700 transition hover:bg-gray-100 hover:text-black"
                    >
                      <Package className="h-4 w-4" />

                      <div>
                        <p className="font-medium">
                          My Orders
                        </p>

                        <p className="text-xs text-gray-400">
                          Track your purchases
                        </p>
                      </div>
                    </Link>

                    {/* WISHLIST */}

                    <Link
                      href="/wishlist"
                      onClick={() =>
                        setProfileOpen(false)
                      }
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-gray-700 transition hover:bg-gray-100 hover:text-black"
                    >
                      <Heart className="h-4 w-4" />

                      <div>
                        <p className="font-medium">
                          Wishlist
                        </p>

                        <p className="text-xs text-gray-400">
                          Saved products
                        </p>
                      </div>
                    </Link>

                    <div className="my-2 border-t" />

                    {/* LOGOUT */}

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-red-600 transition hover:bg-red-50"
                    >
                      <LogOut className="h-4 w-4" />

                      <div className="text-left">
                        <p className="font-medium">
                          Logout
                        </p>

                        <p className="text-xs text-red-400">
                          Sign out of your account
                        </p>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* =================================================
            MOBILE MENU BUTTON
        ================================================= */}

        <button
          type="button"
          className="rounded-lg p-2 transition hover:bg-gray-100 md:hidden"
          onClick={() =>
            setMobileMenu(
              (previous) => !previous
            )
          }
          aria-label={
            mobileMenu
              ? "Close menu"
              : "Open menu"
          }
        >
          {mobileMenu ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* ===================================================
          MOBILE MENU
      =================================================== */}

      {mobileMenu && (
        <div className="border-t bg-white md:hidden">
          <div className="mx-auto max-w-7xl px-4 py-4">

            {/* MOBILE SEARCH */}

            <form
              onSubmit={(event) => {
                handleSearch(event);
                closeMobileMenu();
              }}
              className="relative mb-5"
            >
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

              <Input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search products..."
                className="h-10 pl-9"
              />
            </form>

            <nav className="flex flex-col gap-1">

              {/* HOME */}

              <Link
                href="/"
                onClick={closeMobileMenu}
                className={`rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  isActive("/")
                    ? "bg-gray-100 text-black"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                Home
              </Link>

              {/* PRODUCTS */}

              <Link
                href="/products"
                onClick={closeMobileMenu}
                className={`rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  isActive("/products")
                    ? "bg-gray-100 text-black"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                Products
              </Link>

              {/* CATEGORIES */}

              <div>
                <button
                  type="button"
                  onClick={() =>
                    setMobileCategoriesOpen(
                      (previous) => !previous
                    )
                  }
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm font-medium transition ${
                    isActive("/categories")
                      ? "bg-gray-100 text-black"
                      : "text-gray-700 hover:bg-gray-100"
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
                  <div className="mt-1 rounded-lg bg-gray-50 p-2">

                    {categoriesLoading ? (
                      <p className="px-3 py-3 text-sm text-gray-500">
                        Loading categories...
                      </p>
                    ) : categories.length === 0 ? (
                      <p className="px-3 py-3 text-sm text-gray-500">
                        No categories available.
                      </p>
                    ) : (
                      categories.map(
                        (category) => (
                          <Link
                            key={category.id}
                            href={`/categories/${category.id}`}
                            onClick={
                              closeMobileMenu
                            }
                            className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm text-gray-700 transition hover:bg-white"
                          >
                            <span>
                              {category.name}
                            </span>

                            <span className="text-xs text-gray-400">
                              →
                            </span>
                          </Link>
                        )
                      )
                    )}

                    <div className="mt-1 border-t pt-1">
                      <Link
                        href="/categories"
                        onClick={
                          closeMobileMenu
                        }
                        className="block rounded-lg px-3 py-2.5 text-sm font-semibold text-gray-900 transition hover:bg-white"
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
                onClick={closeMobileMenu}
                className={`rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  isActive("/ai-assistant")
                    ? "bg-gray-100 text-black"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                AI Assistant
              </Link>

              {/* CART */}

              <Link
                href="/cart"
                onClick={closeMobileMenu}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
              >
                <ShoppingCart className="h-4 w-4" />
                Cart
              </Link>

              {!isLoggedIn ? (
                <>
                  {/* LOGIN */}

                  <Link
                    href="/login"
                    onClick={closeMobileMenu}
                    className="rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
                  >
                    Login
                  </Link>

                  {/* SIGN UP */}

                  <Link
                    href="/signup"
                    onClick={closeMobileMenu}
                    className="rounded-lg bg-black px-3 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800"
                  >
                    Sign Up
                  </Link>
                </>
              ) : (
                <>
                  {/* MOBILE USER */}

                  <div className="my-2 border-t pt-4">
                    <div className="mb-3 flex items-center gap-3 px-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gray-900 text-sm font-bold text-white">
                        {getInitials()}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate font-semibold text-gray-900">
                          {user?.full_name ||
                            "User"}
                        </p>

                        <p className="truncate text-xs text-gray-500">
                          {user?.email}
                        </p>

                        <div className="mt-1 flex items-center gap-2">
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-600">
                            {getRoleLabel()}
                          </span>

                          {user?.is_verified && (
                            <span className="text-[10px] font-medium text-green-600">
                              Verified
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* PROFILE */}

                  <Link
                    href="/profile"
                    onClick={closeMobileMenu}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                      isActive("/profile")
                        ? "bg-gray-100 text-black"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <User className="h-4 w-4" />
                    My Profile
                  </Link>

                  {/* DASHBOARD */}

                  {(user?.role === "seller" ||
                    user?.role === "admin") && (
                    <Link
                      href={getDashboardUrl()}
                      onClick={closeMobileMenu}
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      {getDashboardLabel()}
                    </Link>
                  )}

                  {/* ORDERS */}

                  <Link
                    href="/orders"
                    onClick={closeMobileMenu}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
                  >
                    <Package className="h-4 w-4" />
                    My Orders
                  </Link>

                  {/* WISHLIST */}

                  <Link
                    href="/wishlist"
                    onClick={closeMobileMenu}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
                  >
                    <Heart className="h-4 w-4" />
                    Wishlist
                  </Link>

                  <div className="my-2 border-t" />

                  {/* LOGOUT */}

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-red-600 transition hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </>
              )}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}