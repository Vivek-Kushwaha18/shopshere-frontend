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

import {
  getProducts,
  type Product,
} from "@/services/products";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();

  const [mobileMenu, setMobileMenu] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileCategoriesOpen, setMobileCategoriesOpen] =
    useState(false);

  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);

  const [user, setUser] = useState<AuthUser | null>(null);

  const [search, setSearch] = useState("");

  const [products, setProducts] = useState<Product[]>([]);
  const [searchSuggestions, setSearchSuggestions] =
    useState<Product[]>([]);
  const [searchFocused, setSearchFocused] = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

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
        sessionStorage.getItem("access_token");

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

  const mainCategories = categories
    .filter(
      (category) =>
        category.parent_id === null &&
        category.is_active
    )
    .sort((a, b) =>
      a.name.localeCompare(b.name)
    );

  useEffect(() => {
    async function loadProducts() {
      try {
        const result = await getProducts();

        setProducts(result);
      } catch (error) {
        console.error(
          "Header products loading error:",
          error
        );

        setProducts([]);
      }
    }

    loadProducts();
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
        searchRef.current &&
        !searchRef.current.contains(target)
      ) {
        setSearchFocused(false);
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
    setMobileCategoriesOpen(false);
    setMobileMenu(false);

    router.push("/");
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

  function getRoleLabel() {
    if (user?.role === "seller") {
      return "Seller";
    }

    if (user?.role === "admin") {
      return "Admin";
    }

    return "Customer";
  }

  function getDashboardUrl() {
    if (user?.role === "admin") {
      return "/admin/dashboard";
    }

    if (user?.role === "seller") {
      return "/seller/dashboard";
    }

    return "/";
  }

  function getDashboardLabel() {
    if (user?.role === "admin") {
      return "Admin Dashboard";
    }

    if (user?.role === "seller") {
      return "Seller Dashboard";
    }

    return "Dashboard";
  }

  function levenshteinDistance(
    first: string,
    second: string
  ) {
    const matrix = Array.from(
      {
        length: second.length + 1,
      },
      () =>
        Array(first.length + 1).fill(0)
    );

    for (
      let index = 0;
      index <= first.length;
      index++
    ) {
      matrix[0][index] = index;
    }

    for (
      let index = 0;
      index <= second.length;
      index++
    ) {
      matrix[index][0] = index;
    }

    for (
      let row = 1;
      row <= second.length;
      row++
    ) {
      for (
        let column = 1;
        column <= first.length;
        column++
      ) {
        if (
          second[row - 1].toLowerCase() ===
          first[column - 1].toLowerCase()
        ) {
          matrix[row][column] =
            matrix[row - 1][column - 1];
        } else {
          matrix[row][column] = Math.min(
            matrix[row - 1][column] + 1,
            matrix[row][column - 1] + 1,
            matrix[row - 1][column - 1] + 1
          );
        }
      }
    }

    return matrix[second.length][first.length];
  }

  function getSearchSuggestions(value: string) {
    const searchValue =
      value.trim().toLowerCase();

    if (!searchValue) {
      return [];
    }

    const suggestions = products
      .map((product) => {
        const productName =
          product.name?.toLowerCase() || "";

        const productDescription =
          product.description?.toLowerCase() || "";

        let score = 0;

        if (productName === searchValue) {
          score += 100;
        }

        if (
          productName.startsWith(searchValue)
        ) {
          score += 80;
        }

        if (
          productName.includes(searchValue)
        ) {
          score += 60;
        }

        if (
          productDescription.includes(
            searchValue
          )
        ) {
          score += 30;
        }

        const distance =
          levenshteinDistance(
            searchValue,
            productName
          );

        if (
          distance <=
          Math.max(
            2,
            Math.floor(
              productName.length * 0.3
            )
          )
        ) {
          score += 40 - distance * 5;
        }

        return {
          product,
          score,
        };
      })
      .filter(
        (item) => item.score > 0
      )
      .sort(
        (first, second) =>
          second.score - first.score
      )
      .slice(0, 6)
      .map(
        (item) => item.product
      );

    return suggestions;
  }

  function handleSearchChange(value: string) {
    setSearch(value);

    if (!value.trim()) {
      setSearchSuggestions([]);
      setSearchFocused(false);

      return;
    }

    const suggestions =
      getSearchSuggestions(value);

    setSearchSuggestions(
      suggestions
    );

    setSearchFocused(true);
  }

  function handleSearchFocus() {
    if (!search.trim()) {
      return;
    }

    const suggestions =
      getSearchSuggestions(search);

    setSearchSuggestions(
      suggestions
    );

    setSearchFocused(true);
  }

  function handleSuggestionClick(
    product: Product
  ) {
    setSearch(product.name);

    setSearchSuggestions([]);

    setSearchFocused(false);

    router.push(
      `/products/${product.id}`
    );
  }

  function handleSearch(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const trimmedSearch =
      search.trim();

    if (!trimmedSearch) {
      router.push("/products");
      return;
    }

    router.push(
      `/products?search=${encodeURIComponent(
        trimmedSearch
      )}`
    );

    setSearchFocused(false);
  }

  function closeMobileMenu() {
    setMobileMenu(false);
    setMobileCategoriesOpen(false);
  }

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      {/* MAIN HEADER */}
      <div className="border-b">
        <div className="mx-auto flex h-[68px] max-w-7xl items-center gap-4 px-4">
          {/* LOGO */}
          <Link
            href="/"
            className="flex shrink-0 items-center gap-2"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-lg font-bold text-white shadow-sm">
              S
            </div>

            <div className="hidden sm:block">
              <h1 className="text-lg font-bold leading-none tracking-tight text-blue-600">
                ShopSphere
              </h1>

              <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-gray-500">
                Smart Shopping
              </p>
            </div>
          </Link>

          {/* DESKTOP SEARCH */}
          <div
            ref={searchRef}
            className="relative hidden min-w-0 flex-1 md:block"
          >
            <form
              onSubmit={handleSearch}
              className="relative"
            >
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />

              <Input
                value={search}
                onChange={(event) =>
                  handleSearchChange(
                    event.target.value
                  )
                }
                onFocus={
                  handleSearchFocus
                }
                placeholder="Search for products, brands and more"
                className="h-11 w-full rounded-lg border-0 bg-blue-50 pl-12 pr-4 text-sm shadow-none outline-none ring-0 placeholder:text-gray-500 focus-visible:ring-1 focus-visible:ring-blue-200"
              />
            </form>

            {/* SEARCH SUGGESTIONS */}
            {searchFocused &&
              searchSuggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-12 z-50 overflow-hidden rounded-lg border bg-white shadow-xl">
                  {searchSuggestions.map(
                    (product) => (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() =>
                          handleSuggestionClick(
                            product
                          )
                        }
                        className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-gray-50"
                      >
                        {product.image ? (
                          <img
                            src={
                              product.image
                            }
                            alt={
                              product.name
                            }
                            className="h-10 w-10 rounded-md object-cover"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-gray-100">
                            <Search className="h-4 w-4 text-gray-400" />
                          </div>
                        )}

                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-gray-900">
                            {
                              product.name
                            }
                          </p>

                          <p className="truncate text-xs text-gray-500">
                            ₹
                            {
                              product.price
                            }
                          </p>
                        </div>
                      </button>
                    )
                  )}
                </div>
              )}
          </div>

          {/* DESKTOP ACTIONS */}
          <div className="hidden shrink-0 items-center gap-1 md:flex">
            <Link
              href="/cart"
              className="flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 hover:text-blue-600"
            >
              <ShoppingCart className="h-5 w-5" />
              <span>Cart</span>
            </Link>

            {!isLoggedIn ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="font-semibold"
                >
                  <Link href="/login">
                    Login
                  </Link>
                </Button>

                <Button
                  size="sm"
                  asChild
                  className="rounded-lg bg-blue-600 font-semibold hover:bg-blue-700"
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
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() =>
                    setProfileOpen(
                      (previous) =>
                        !previous
                    )
                  }
                  className="h-10 gap-2 rounded-lg px-2"
                  aria-expanded={
                    profileOpen
                  }
                  aria-haspopup="menu"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                    {getInitials()}
                  </span>

                  <span className="hidden max-w-[120px] truncate text-sm font-semibold lg:block">
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
                    <div className="bg-blue-50 px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
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
                            <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-700">
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
                      <Link
                        href="/profile"
                        onClick={() =>
                          setProfileOpen(
                            false
                          )
                        }
                        className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                          isActive(
                            "/profile"
                          )
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

                      {(user?.role === "seller" ||
                        user?.role === "admin") && (
                        <Link
                          href={getDashboardUrl()}
                          onClick={() =>
                            setProfileOpen(
                              false
                            )
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

                      <Link
                        href="/orders"
                        onClick={() =>
                          setProfileOpen(
                            false
                          )
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

                      <Link
                        href="/wishlist"
                        onClick={() =>
                          setProfileOpen(
                            false
                          )
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

                      <button
                        type="button"
                        onClick={
                          handleLogout
                        }
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

          {/* MOBILE MENU BUTTON */}
          <button
            type="button"
            className="rounded-lg p-2 transition hover:bg-gray-100 md:hidden"
            onClick={() =>
              setMobileMenu(
                (previous) =>
                  !previous
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
      </div>

      {/* DESKTOP MAIN CATEGORY NAVIGATION */}
      <div className="hidden border-b bg-white md:block">
        <div className="mx-auto flex h-12 max-w-7xl items-center justify-center gap-8 overflow-x-auto px-4">
          <Link
            href="/"
            className={`shrink-0 text-sm font-semibold transition ${
              isActive("/")
                ? "text-blue-600"
                : "text-gray-700 hover:text-blue-600"
            }`}
          >
            Home
          </Link>

          {categoriesLoading ? (
            <span className="shrink-0 text-sm text-gray-400">
              Loading categories...
            </span>
          ) : (
            mainCategories.map(
              (category) => (
                <Link
                  key={category.id}
                  href={`/categories/${category.slug}`}
                  className={`shrink-0 text-sm font-semibold transition ${
                    pathname.startsWith(
                      `/categories/${category.slug}`
                    )
                      ? "text-blue-600"
                      : "text-gray-700 hover:text-blue-600"
                  }`}
                >
                  {category.name}
                </Link>
              )
            )
          )}

          <Link
            href="/ai-assistant"
            className={`shrink-0 text-sm font-semibold transition ${
              isActive("/ai-assistant")
                ? "text-blue-600"
                : "text-gray-700 hover:text-blue-600"
            }`}
          >
            AI Assistant
          </Link>
        </div>
      </div>

      {/* MOBILE MENU */}
      {mobileMenu && (
        <div className="border-t bg-white md:hidden">
          <div className="mx-auto max-w-7xl px-4 py-4">
            {/* MOBILE SEARCH */}
            <div
              ref={searchRef}
              className="relative mb-4"
            >
              <form
                onSubmit={(event) => {
                  handleSearch(event);
                  closeMobileMenu();
                }}
                className="relative"
              >
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />

                <Input
                  value={search}
                  onChange={(event) =>
                    handleSearchChange(
                      event.target.value
                    )
                  }
                  onFocus={
                    handleSearchFocus
                  }
                  placeholder="Search products, brands and more"
                  className="h-11 bg-blue-50 pl-11"
                />
              </form>

              {searchFocused &&
                searchSuggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-12 z-50 overflow-hidden rounded-xl border bg-white shadow-xl">
                    {searchSuggestions.map(
                      (product) => (
                        <button
                          key={product.id}
                          type="button"
                          onClick={() => {
                            handleSuggestionClick(
                              product
                            );

                            closeMobileMenu();
                          }}
                          className="flex w-full items-center gap-3 px-3 py-3 text-left transition hover:bg-gray-50"
                        >
                          {product.image ? (
                            <img
                              src={
                                product.image
                              }
                              alt={
                                product.name
                              }
                              className="h-10 w-10 rounded-md object-cover"
                            />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-gray-100">
                              <Search className="h-4 w-4 text-gray-400" />
                            </div>
                          )}

                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">
                              {
                                product.name
                              }
                            </p>

                            <p className="text-xs text-gray-500">
                              ₹
                              {
                                product.price
                              }
                            </p>
                          </div>
                        </button>
                      )
                    )}
                  </div>
                )}
            </div>

            {/* MOBILE NAVIGATION */}
            <nav className="flex flex-col gap-1">
              <Link
                href="/"
                onClick={
                  closeMobileMenu
                }
                className={`rounded-lg px-3 py-3 text-sm font-semibold transition ${
                  isActive("/")
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                Home
              </Link>

              {/* MOBILE CATEGORIES */}
              <div>
                <button
                  type="button"
                  onClick={() =>
                    setMobileCategoriesOpen(
                      (previous) =>
                        !previous
                    )
                  }
                  className="flex w-full items-center justify-between rounded-lg px-3 py-3 text-left text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
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
                    ) : mainCategories.length ===
                      0 ? (
                      <p className="px-3 py-3 text-sm text-gray-500">
                        No categories available.
                      </p>
                    ) : (
                      mainCategories.map(
                        (category) => (
                          <Link
                            key={
                              category.id
                            }
                            href={`/categories/${category.slug}`}
                            onClick={
                              closeMobileMenu
                            }
                            className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-sm transition ${
                              pathname.startsWith(
                                `/categories/${category.slug}`
                              )
                                ? "bg-white font-semibold text-blue-600"
                                : "text-gray-700 hover:bg-white hover:text-blue-600"
                            }`}
                          >
                            <span>
                              {
                                category.name
                              }
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
                        className="block rounded-lg px-3 py-2.5 text-sm font-semibold text-blue-600 transition hover:bg-white"
                      >
                        View all categories
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              <Link
                href="/ai-assistant"
                onClick={
                  closeMobileMenu
                }
                className={`rounded-lg px-3 py-3 text-sm font-semibold transition ${
                  isActive(
                    "/ai-assistant"
                  )
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                AI Assistant
              </Link>

              <Link
                href="/cart"
                onClick={
                  closeMobileMenu
                }
                className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
              >
                <ShoppingCart className="h-5 w-5" />
                Cart
              </Link>

              {!isLoggedIn ? (
                <>
                  <Link
                    href="/login"
                    onClick={
                      closeMobileMenu
                    }
                    className="rounded-lg px-3 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
                  >
                    Login
                  </Link>

                  <Link
                    href="/signup"
                    onClick={
                      closeMobileMenu
                    }
                    className="rounded-lg bg-blue-600 px-3 py-3 text-center text-sm font-semibold text-white transition hover:bg-blue-700"
                  >
                    Sign Up
                  </Link>
                </>
              ) : (
                <>
                  <div className="my-2 border-t pt-4">
                    <div className="mb-3 flex items-center gap-3 px-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
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

                  <Link
                    href="/profile"
                    onClick={
                      closeMobileMenu
                    }
                    className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold transition ${
                      isActive(
                        "/profile"
                      )
                        ? "bg-blue-50 text-blue-600"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <User className="h-5 w-5" />
                    My Profile
                  </Link>

                  {(user?.role === "seller" ||
                    user?.role === "admin") && (
                    <Link
                      href={getDashboardUrl()}
                      onClick={
                        closeMobileMenu
                      }
                      className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
                    >
                      <LayoutDashboard className="h-5 w-5" />
                      {getDashboardLabel()}
                    </Link>
                  )}

                  <Link
                    href="/orders"
                    onClick={
                      closeMobileMenu
                    }
                    className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
                  >
                    <Package className="h-5 w-5" />
                    My Orders
                  </Link>

                  <Link
                    href="/wishlist"
                    onClick={
                      closeMobileMenu
                    }
                    className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
                  >
                    <Heart className="h-5 w-5" />
                    Wishlist
                  </Link>

                  <div className="my-2 border-t" />

                  <button
                    type="button"
                    onClick={
                      handleLogout
                    }
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-semibold text-red-600 transition hover:bg-red-50"
                  >
                    <LogOut className="h-5 w-5" />
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