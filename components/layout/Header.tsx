
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
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

import { getCategories, type Category } from "@/services/categories";
import { getProducts, type Product } from "@/services/products";
import { getCart, CART_UPDATED_EVENT } from "@/services/cart";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();

  const isProductDetailPage = /^\/products\/[^/]+\/?$/.test(pathname);

  const [mobileMenu, setMobileMenu] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileCategoriesOpen, setMobileCategoriesOpen] = useState(false);

  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);

  const [search, setSearch] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [searchSuggestions, setSearchSuggestions] = useState<Product[]>([]);
  const [searchFocused, setSearchFocused] = useState(false);

  const [cartCount, setCartCount] = useState(0);

  const profileRef = useRef<HTMLDivElement>(null);
  const desktopSearchRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);

  function isActive(path: string) {
    if (path === "/") {
      return pathname === "/";
    }

    return pathname === path || pathname.startsWith(`${path}/`);
  }

  const loadAuthUser = useCallback(() => {
    const accessToken =
      sessionStorage.getItem("access_token") ||
      localStorage.getItem("access_token");

    const storedUser = getStoredUser();

    if (accessToken && storedUser) {
      setIsLoggedIn(true);
      setUser(storedUser);
    } else {
      setIsLoggedIn(false);
      setUser(null);
      setCartCount(0);
    }
  }, []);

  useEffect(() => {
    loadAuthUser();

    window.addEventListener("auth-change", loadAuthUser);

    return () => {
      window.removeEventListener("auth-change", loadAuthUser);
    };
  }, [loadAuthUser]);

  useEffect(() => {
    let active = true;

    async function loadCategories() {
      try {
        setCategoriesLoading(true);

        const result = await getCategories();

        if (active) {
          setCategories(result);
        }
      } catch (error) {
        console.error("Header categories loading error:", error);

        if (active) {
          setCategories([]);
        }
      } finally {
        if (active) {
          setCategoriesLoading(false);
        }
      }
    }

    void loadCategories();

    return () => {
      active = false;
    };
  }, []);

  const mainCategories = categories
    .filter(
      (category) =>
        category.parent_id === null && category.is_active
    )
    .sort((a, b) => a.name.localeCompare(b.name));

  useEffect(() => {
    let active = true;

    async function loadProducts() {
      try {
        const result = await getProducts();

        if (active) {
          setProducts(result);
        }
      } catch (error) {
        console.error("Header products loading error:", error);

        if (active) {
          setProducts([]);
        }
      }
    }

    void loadProducts();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    let requestInProgress = false;
    let refreshRequested = false;

    async function loadCartCount() {
      const accessToken =
        sessionStorage.getItem("access_token") ||
        localStorage.getItem("access_token");

      const storedUser = getStoredUser();

      if (!accessToken || !storedUser) {
        if (active) {
          setCartCount(0);
        }

        return;
      }

      if (requestInProgress) {
        refreshRequested = true;
        return;
      }

      requestInProgress = true;

      try {
        do {
          refreshRequested = false;

          const cart = await getCart();

          if (!active) {
            return;
          }

          const items = Array.isArray(cart.items) ? cart.items : [];

          const uniqueProductIds = new Set(
            items
              .map((item) => item.product_id)
              .filter(
                (productId) =>
                  productId !== undefined && productId !== null
              )
          );

          setCartCount(uniqueProductIds.size);
        } while (active && refreshRequested);
      } catch (error) {
        console.error("Header cart loading error:", error);
      } finally {
        requestInProgress = false;
      }
    }

    function handleCartUpdated() {
      void loadCartCount();
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        void loadCartCount();
      }
    }

    void loadCartCount();

    window.addEventListener(CART_UPDATED_EVENT, handleCartUpdated);
    window.addEventListener("auth-change", handleCartUpdated);
    window.addEventListener("focus", handleCartUpdated);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      active = false;

      window.removeEventListener(CART_UPDATED_EVENT, handleCartUpdated);
      window.removeEventListener("auth-change", handleCartUpdated);
      window.removeEventListener("focus", handleCartUpdated);
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;

      if (profileRef.current && !profileRef.current.contains(target)) {
        setProfileOpen(false);
      }

      const clickedInsideDesktopSearch =
        desktopSearchRef.current?.contains(target) ?? false;

      const clickedInsideMobileSearch =
        mobileSearchRef.current?.contains(target) ?? false;

      if (!clickedInsideDesktopSearch && !clickedInsideMobileSearch) {
        setSearchFocused(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    setMobileMenu(false);
    setMobileCategoriesOpen(false);
    setProfileOpen(false);
    setSearchFocused(false);
  }, [pathname]);

  function handleLogout() {
    clearAuthSession();

    setIsLoggedIn(false);
    setUser(null);
    setCartCount(0);

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
          parts[0][0] + parts[parts.length - 1][0]
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
    if (user?.role === "seller") return "Seller";
    if (user?.role === "admin") return "Admin";

    return "Customer";
  }

  function getDashboardUrl() {
    if (user?.role === "admin") return "/admin/dashboard";
    if (user?.role === "seller") return "/seller/dashboard";

    return "/";
  }

  function getDashboardLabel() {
    if (user?.role === "admin") return "Admin Dashboard";
    if (user?.role === "seller") return "Seller Dashboard";

    return "Dashboard";
  }

  // Search product names only. Do not use descriptions or fuzzy matching.
  function getSearchSuggestions(value: string): Product[] {
    const searchTerms = value
      .trim()
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean);

    if (searchTerms.length === 0) {
      return [];
    }

    return products
      .filter((product) => {
        const productName = (product.name ?? "")
          .toLowerCase()
          .replace(/[^\p{L}\p{N}]+/gu, " ");

        return searchTerms.every((term) =>
          productName.includes(term)
        );
      })
      .slice(0, 6);
  }

  function handleSearchChange(value: string) {
    setSearch(value);

    if (!value.trim()) {
      setSearchSuggestions([]);
      setSearchFocused(false);
      return;
    }

    setSearchSuggestions(getSearchSuggestions(value));
    setSearchFocused(true);
  }

  function handleSearchFocus() {
    if (!search.trim()) {
      return;
    }

    setSearchSuggestions(getSearchSuggestions(search));
    setSearchFocused(true);
  }

  function handleSuggestionClick(product: Product) {
    setSearch(product.name);
    setSearchSuggestions([]);
    setSearchFocused(false);
    setMobileMenu(false);

    router.push(`/products/${product.id}`);
  }

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedSearch = search.trim();

    setSearchFocused(false);
    setSearchSuggestions([]);

    if (!trimmedSearch) {
      router.push("/products");
      return;
    }

    router.push(`/products?search=${encodeURIComponent(trimmedSearch)}`);
  }

  function closeMobileMenu() {
    setMobileMenu(false);
    setMobileCategoriesOpen(false);
    setSearchFocused(false);
  }

  function CartCountBadge() {
    if (cartCount <= 0) {
      return null;
    }

    return (
      <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-white">
        {cartCount > 99 ? "99+" : cartCount}
      </span>
    );
  }

  function SearchSuggestions() {
    if (!searchFocused || !search.trim()) {
      return null;
    }

    return (
      <div className="absolute left-0 right-0 top-12 z-50 overflow-hidden rounded-lg border bg-white shadow-xl">
        {searchSuggestions.length > 0 ? (
          searchSuggestions.map((product) => (
            <button
              key={product.id}
              type="button"
              onClick={() => handleSuggestionClick(product)}
              className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-gray-50"
            >
              {product.image ? (
                <img
                  src={product.image}
                  alt={product.name}
                  className="h-10 w-10 rounded-md object-cover"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-gray-100">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
              )}

              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-gray-900">
                  {product.name}
                </p>
                <p className="truncate text-xs text-gray-500">
                  ₹{product.price}
                </p>
              </div>
            </button>
          ))
        ) : (
          <p className="px-4 py-3 text-sm text-gray-500">
            No matching products found.
          </p>
        )}
      </div>
    );
  }

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      <div className="border-b">
        <div className="mx-auto flex h-[68px] max-w-7xl items-center gap-4 px-4">
          <Link
            href="/"
            className="flex shrink-0 items-center gap-2"
            aria-label="ShopSphere home"
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
            ref={desktopSearchRef}
            className="relative hidden min-w-0 flex-1 md:block"
          >
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />

              <Input
                value={search}
                onChange={(event) =>
                  handleSearchChange(event.target.value)
                }
                onFocus={handleSearchFocus}
                placeholder="Search for products, brands and more"
                className="h-11 w-full rounded-lg border-0 bg-blue-50 pl-12 pr-4 text-sm shadow-none outline-none ring-0 placeholder:text-gray-500 focus-visible:ring-1 focus-visible:ring-blue-200"
              />
            </form>

            <SearchSuggestions />
          </div>

          {/* DESKTOP ACTIONS */}
          <div className="hidden shrink-0 items-center gap-1 md:flex">
            <Link
              href="/cart"
              aria-label={`Cart${cartCount > 0 ? `, ${cartCount} different products` : ""}`}
              className="flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 hover:text-blue-600"
            >
              <span className="relative inline-flex">
                <ShoppingCart className="h-5 w-5" />
                <CartCountBadge />
              </span>
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
                  <Link href="/login">Login</Link>
                </Button>

                <Button
                  size="sm"
                  asChild
                  className="rounded-lg bg-blue-600 font-semibold hover:bg-blue-700"
                >
                  <Link href="/signup">Sign Up</Link>
                </Button>
              </>
            ) : (
              <div ref={profileRef} className="relative ml-1">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() =>
                    setProfileOpen((previous) => !previous)
                  }
                  className="h-10 gap-2 rounded-lg px-2"
                  aria-expanded={profileOpen}
                  aria-haspopup="menu"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                    {getInitials()}
                  </span>

                  <span className="hidden max-w-[120px] truncate text-sm font-semibold lg:block">
                    {user?.full_name || user?.email || "Profile"}
                  </span>

                  <ChevronDown
                    className={`h-4 w-4 text-gray-500 transition-transform ${
                      profileOpen ? "rotate-180" : ""
                    }`}
                  />
                </Button>

                {profileOpen && (
                  <div className="absolute right-0 top-12 z-50 w-80 overflow-hidden rounded-xl border bg-white shadow-2xl">
                    <div className="bg-blue-50 px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                          {getInitials()}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate font-semibold text-gray-900">
                            {user?.full_name || "User"}
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
                        onClick={() => setProfileOpen(false)}
                        className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                          isActive("/profile")
                            ? "bg-gray-100 font-semibold text-black"
                            : "text-gray-700 hover:bg-gray-100 hover:text-black"
                        }`}
                      >
                        <User className="h-4 w-4" />
                        <div>
                          <p className="font-medium">My Profile</p>
                          <p className="text-xs text-gray-400">
                            Manage your account
                          </p>
                        </div>
                      </Link>

                      {(user?.role === "seller" || user?.role === "admin") && (
                        <Link
                          href={getDashboardUrl()}
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-gray-700 transition hover:bg-gray-100 hover:text-black"
                        >
                          <LayoutDashboard className="h-4 w-4" />
                          <div>
                            <p className="font-medium">{getDashboardLabel()}</p>
                            <p className="text-xs text-gray-400">
                              Manage your workspace
                            </p>
                          </div>
                        </Link>
                      )}

                      <Link
                        href="/orders"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-gray-700 transition hover:bg-gray-100 hover:text-black"
                      >
                        <Package className="h-4 w-4" />
                        <div>
                          <p className="font-medium">My Orders</p>
                          <p className="text-xs text-gray-400">
                            Track your purchases
                          </p>
                        </div>
                      </Link>

                      <Link
                        href="/wishlist"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-gray-700 transition hover:bg-gray-100 hover:text-black"
                      >
                        <Heart className="h-4 w-4" />
                        <div>
                          <p className="font-medium">Wishlist</p>
                          <p className="text-xs text-gray-400">
                            Saved products
                          </p>
                        </div>
                      </Link>

                      <div className="my-2 border-t" />

                      <button
                        type="button"
                        onClick={handleLogout}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-red-600 transition hover:bg-red-50"
                      >
                        <LogOut className="h-4 w-4" />
                        <div className="text-left">
                          <p className="font-medium">Logout</p>
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

          <button
            type="button"
            className="rounded-lg p-2 transition hover:bg-gray-100 md:hidden"
            onClick={() => setMobileMenu((previous) => !previous)}
            aria-label={mobileMenu ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenu}
          >
            {mobileMenu ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {!isProductDetailPage && (
        <div className="hidden border-b bg-white md:block">
          <nav className="mx-auto flex h-12 max-w-7xl items-center justify-center gap-8 overflow-x-auto px-4">
            <Link
              href="/for-you"
              className={`shrink-0 text-sm font-semibold transition ${
                isActive("/for-you")
                  ? "text-blue-600"
                  : "text-gray-700 hover:text-blue-600"
              }`}
            >
              For You
            </Link>

            {categoriesLoading ? (
              <span className="shrink-0 text-sm text-gray-400">
                Loading categories...
              </span>
            ) : (
              mainCategories.map((category) => (
                <Link
                  key={category.id}
                  href={`/categories/${category.slug}`}
                  className={`shrink-0 text-sm font-semibold transition ${
                    pathname.startsWith(`/categories/${category.slug}`)
                      ? "text-blue-600"
                      : "text-gray-700 hover:text-blue-600"
                  }`}
                >
                  {category.name}
                </Link>
              ))
            )}
          </nav>
        </div>
      )}

      {/* MOBILE MENU */}
      {mobileMenu && (
        <div className="border-t bg-white md:hidden">
          <div className="mx-auto max-w-7xl px-4 py-4">
            <div ref={mobileSearchRef} className="relative mb-4">
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
                    handleSearchChange(event.target.value)
                  }
                  onFocus={handleSearchFocus}
                  placeholder="Search products, brands and more"
                  className="h-11 bg-blue-50 pl-11"
                />
              </form>

              <SearchSuggestions />
            </div>

            <nav className="flex flex-col gap-1">
              {!isProductDetailPage && (
                <>
                  <Link
                    href="/for-you"
                    onClick={closeMobileMenu}
                    className={`rounded-lg px-3 py-3 text-sm font-semibold transition ${
                      isActive("/for-you")
                        ? "bg-blue-50 text-blue-600"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    For You
                  </Link>

                  <div>
                    <button
                      type="button"
                      onClick={() =>
                        setMobileCategoriesOpen((previous) => !previous)
                      }
                      className="flex w-full items-center justify-between rounded-lg px-3 py-3 text-left text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
                      aria-expanded={mobileCategoriesOpen}
                    >
                      <span>Categories</span>
                      <ChevronDown
                        className={`h-4 w-4 transition-transform ${
                          mobileCategoriesOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {mobileCategoriesOpen && (
                      <div className="mt-1 rounded-lg bg-gray-50 p-2">
                        {categoriesLoading ? (
                          <p className="px-3 py-3 text-sm text-gray-500">
                            Loading categories...
                          </p>
                        ) : mainCategories.length === 0 ? (
                          <p className="px-3 py-3 text-sm text-gray-500">
                            No categories available.
                          </p>
                        ) : (
                          mainCategories.map((category) => (
                            <Link
                              key={category.id}
                              href={`/categories/${category.slug}`}
                              onClick={closeMobileMenu}
                              className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-sm transition ${
                                pathname.startsWith(
                                  `/categories/${category.slug}`
                                )
                                  ? "bg-white font-semibold text-blue-600"
                                  : "text-gray-700 hover:bg-white hover:text-blue-600"
                              }`}
                            >
                              <span>{category.name}</span>
                              <span className="text-xs text-gray-400">→</span>
                            </Link>
                          ))
                        )}

                        <div className="mt-1 border-t pt-1">
                          <Link
                            href="/categories"
                            onClick={closeMobileMenu}
                            className="block rounded-lg px-3 py-2.5 text-sm font-semibold text-blue-600 transition hover:bg-white"
                          >
                            View all categories
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              <Link
                href="/cart"
                onClick={closeMobileMenu}
                aria-label={`Cart${cartCount > 0 ? `, ${cartCount} different products` : ""}`}
                className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
              >
                <span className="relative inline-flex">
                  <ShoppingCart className="h-5 w-5" />
                  <CartCountBadge />
                </span>
                <span>Cart</span>

                {cartCount > 0 && (
                  <span className="ml-auto rounded-full bg-red-50 px-2 py-0.5 text-xs font-bold text-red-600">
                    {cartCount > 99 ? "99+" : cartCount}{" "}
                    {cartCount === 1 ? "product" : "products"}
                  </span>
                )}
              </Link>

              {!isLoggedIn ? (
                <>
                  <Link
                    href="/login"
                    onClick={closeMobileMenu}
                    className="rounded-lg px-3 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
                  >
                    Login
                  </Link>
                  <Link
                    href="/signup"
                    onClick={closeMobileMenu}
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
                          {user?.full_name || "User"}
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
                    onClick={closeMobileMenu}
                    className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold transition ${
                      isActive("/profile")
                        ? "bg-blue-50 text-blue-600"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <User className="h-5 w-5" />
                    My Profile
                  </Link>

                  {(user?.role === "seller" || user?.role === "admin") && (
                    <Link
                      href={getDashboardUrl()}
                      onClick={closeMobileMenu}
                      className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
                    >
                      <LayoutDashboard className="h-5 w-5" />
                      {getDashboardLabel()}
                    </Link>
                  )}

                  <Link
                    href="/orders"
                    onClick={closeMobileMenu}
                    className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
                  >
                    <Package className="h-5 w-5" />
                    My Orders
                  </Link>

                  <Link
                    href="/wishlist"
                    onClick={closeMobileMenu}
                    className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
                  >
                    <Heart className="h-5 w-5" />
                    Wishlist
                  </Link>

                  <div className="my-2 border-t" />

                  <button
                    type="button"
                    onClick={handleLogout}
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
