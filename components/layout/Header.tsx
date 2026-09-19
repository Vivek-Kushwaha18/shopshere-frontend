"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

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
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  clearAuthSession,
  getStoredUser,
} from "@/services/auth";

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
  const [mobileMenu, setMobileMenu] =
    useState(false);

  const [isLoggedIn, setIsLoggedIn] =
    useState(false);

  const [profileOpen, setProfileOpen] =
    useState(false);

  const [user, setUser] =
    useState<UserData | null>(null);

  const [search, setSearch] =
    useState("");

  const profileRef =
    useRef<HTMLDivElement>(null);

  // =====================================================
  // LOAD AUTHENTICATION STATE
  // =====================================================

  useEffect(() => {
    function loadAuthUser() {
      const accessToken =
        localStorage.getItem(
          "access_token"
        );

      const storedUser =
        getStoredUser();

      if (
        accessToken &&
        storedUser
      ) {
        setIsLoggedIn(true);
        setUser(
          storedUser as UserData
        );
      } else {
        setIsLoggedIn(false);
        setUser(null);
      }
    }

    // Load when Header first appears
    loadAuthUser();

    // Listen for login/logout/session changes
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
  // CLOSE PROFILE DROPDOWN WHEN CLICKING OUTSIDE
  // =====================================================

  useEffect(() => {
    function handleClickOutside(
      event: MouseEvent
    ) {
      if (
        profileRef.current &&
        !profileRef.current.contains(
          event.target as Node
        )
      ) {
        setProfileOpen(false);
      }
    }

    document.addEventListener(
      "click",
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        "click",
        handleClickOutside
      );
    };
  }, []);

  // =====================================================
  // LOGOUT
  // =====================================================

  function handleLogout() {
    // There is no /auth/logout endpoint
    // in the current backend.
    //
    // Logout is therefore handled locally
    // by removing the authentication session.

    clearAuthSession();

    setIsLoggedIn(false);
    setUser(null);
    setProfileOpen(false);
    setMobileMenu(false);

    // Go back to home page
    window.location.href = "/";
  }

  // =====================================================
  // GET USER INITIALS
  // =====================================================

  function getInitials() {
    const name =
      user?.full_name?.trim();

    if (name) {
      const parts =
        name.split(/\s+/);

      if (parts.length >= 2) {
        return (
          parts[0][0] +
          parts[parts.length - 1][0]
        ).toUpperCase();
      }

      return parts[0][0].toUpperCase();
    }

    const email =
      user?.email?.trim();

    if (email) {
      return email[0].toUpperCase();
    }

    return "U";
  }

  // =====================================================
  // SEARCH
  // =====================================================

  function handleSearch(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const trimmedSearch =
      search.trim();

    if (!trimmedSearch) {
      return;
    }

    window.location.href =
      `/products?search=${encodeURIComponent(
        trimmedSearch
      )}`;
  }

  return (
    <header className="sticky top-0 z-50 border-b bg-white">

      {/* =================================================
          MAIN HEADER
      ================================================== */}

      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4">

        {/* =================================================
            LOGO
        ================================================== */}

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

        {/* =================================================
            DESKTOP NAVIGATION
        ================================================== */}

        <nav className="hidden items-center gap-6 md:flex">

          <Link
            href="/"
            className="text-sm font-medium hover:text-gray-600"
          >
            Home
          </Link>

          <Link
            href="/products"
            className="text-sm font-medium hover:text-gray-600"
          >
            Products
          </Link>

          <Link
            href="/categories"
            className="text-sm font-medium hover:text-gray-600"
          >
            Categories
          </Link>

          <Link
            href="/ai-assistant"
            className="text-sm font-medium hover:text-gray-600"
          >
            AI Assistant
          </Link>

        </nav>

        {/* =================================================
            SEARCH
        ================================================== */}

        <div className="hidden w-64 lg:block">

          <form
            onSubmit={handleSearch}
            className="relative"
          >
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />

            <Input
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search products..."
              className="pl-9"
            />
          </form>

        </div>

        {/* =================================================
            DESKTOP ACTIONS
        ================================================== */}

        <div className="hidden items-center gap-2 md:flex">

          {/* CART */}

          <Button
            variant="ghost"
            size="icon"
            asChild
          >
            <Link href="/cart">
              <ShoppingCart className="h-5 w-5" />
            </Link>
          </Button>

          {/* =================================================
              LOGGED OUT
          ================================================== */}

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

            /* =================================================
               LOGGED IN
            ================================================== */

            <div
              ref={profileRef}
              className="relative"
            >

              {/* USER BUTTON */}

              <Button
                variant="ghost"
                onClick={() =>
                  setProfileOpen(
                    (previous) =>
                      !previous
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

              {/* =================================================
                  USER DROPDOWN
              ================================================== */}

              {profileOpen && (
                <div className="absolute right-0 top-12 w-72 rounded-lg border bg-white p-2 shadow-lg">

                  {/* USER INFORMATION */}

                  <div className="flex items-center gap-3 px-3 py-3">

                    {/* PROFILE PHOTO */}

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

                    {/* NAME / EMAIL / ROLE */}

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

                  {/* =================================================
                      ORDERS
                  ================================================== */}

                  <Link
                    href="/orders"
                    onClick={() =>
                      setProfileOpen(
                        false
                      )
                    }
                    className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-gray-100"
                  >
                    <Package className="h-4 w-4" />

                    My Orders
                  </Link>

                  {/* =================================================
                      WISHLIST
                  ================================================== */}

                  <Link
                    href="/wishlist"
                    onClick={() =>
                      setProfileOpen(
                        false
                      )
                    }
                    className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-gray-100"
                  >
                    <Heart className="h-4 w-4" />

                    Wishlist
                  </Link>

                  <div className="my-1 border-t" />

                  {/* =================================================
                      LOGOUT
                  ================================================== */}

                  <button
                    type="button"
                    onClick={
                      handleLogout
                    }
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

        {/* =================================================
            MOBILE MENU BUTTON
        ================================================== */}

        <button
          type="button"
          className="md:hidden"
          onClick={() =>
            setMobileMenu(
              (previous) =>
                !previous
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

      {/* =================================================
          MOBILE MENU
      ================================================== */}

      {mobileMenu && (
        <div className="border-t bg-white px-4 py-4 md:hidden">

          <nav className="flex flex-col gap-4">

            {/* HOME */}

            <Link
              href="/"
              onClick={() =>
                setMobileMenu(false)
              }
              className="text-sm font-medium"
            >
              Home
            </Link>

            {/* PRODUCTS */}

            <Link
              href="/products"
              onClick={() =>
                setMobileMenu(false)
              }
              className="text-sm font-medium"
            >
              Products
            </Link>

            {/* CATEGORIES */}

            <Link
              href="/categories"
              onClick={() =>
                setMobileMenu(false)
              }
              className="text-sm font-medium"
            >
              Categories
            </Link>

            {/* AI ASSISTANT */}

            <Link
              href="/ai-assistant"
              onClick={() =>
                setMobileMenu(false)
              }
              className="text-sm font-medium"
            >
              AI Assistant
            </Link>

            {/* CART */}

            <Link
              href="/cart"
              onClick={() =>
                setMobileMenu(false)
              }
              className="flex items-center gap-2 text-sm font-medium"
            >
              <ShoppingCart className="h-4 w-4" />

              Cart
            </Link>

            {/* =================================================
                MOBILE LOGGED OUT
            ================================================== */}

            {!isLoggedIn ? (
              <>
                <Link
                  href="/login"
                  onClick={() =>
                    setMobileMenu(
                      false
                    )
                  }
                  className="text-sm font-medium"
                >
                  Login
                </Link>

                <Link
                  href="/signup"
                  onClick={() =>
                    setMobileMenu(
                      false
                    )
                  }
                  className="text-sm font-medium"
                >
                  Sign Up
                </Link>
              </>
            ) : (
              <>
                {/* =================================================
                    MOBILE USER
                ================================================== */}

                <div className="border-t pt-4">

                  <div className="flex items-center gap-3">

                    {/* PROFILE PHOTO */}

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

                    {/* USER INFO */}

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

                {/* =================================================
                    ORDERS
                ================================================== */}

                <Link
                  href="/orders"
                  onClick={() =>
                    setMobileMenu(
                      false
                    )
                  }
                  className="flex items-center gap-2 text-sm font-medium"
                >
                  <Package className="h-4 w-4" />

                  My Orders
                </Link>

                {/* =================================================
                    WISHLIST
                ================================================== */}

                <Link
                  href="/wishlist"
                  onClick={() =>
                    setMobileMenu(
                      false
                    )
                  }
                  className="flex items-center gap-2 text-sm font-medium"
                >
                  <Heart className="h-4 w-4" />

                  Wishlist
                </Link>

                {/* =================================================
                    LOGOUT
                ================================================== */}

                <button
                  type="button"
                  onClick={
                    handleLogout
                  }
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