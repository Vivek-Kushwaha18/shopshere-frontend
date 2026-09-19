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

import { getProfile, logout } from "@/services/auth";

interface UserData {
  id: number;
  full_name: string;
  email: string;
  phone?: string | null;
  role: string;
  is_active: boolean;
  is_verified: boolean;
}

export default function Header() {
  const [mobileMenu, setMobileMenu] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);

  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadUser() {
      const token = localStorage.getItem("access_token");

      if (!token) {
        setIsLoggedIn(false);
        setUser(null);
        return;
      }

      const result = await getProfile();

      if (result.success) {
        setIsLoggedIn(true);
        setUser(result.data);

        localStorage.setItem("isLoggedIn", "true");
      } else {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("isLoggedIn");

        setIsLoggedIn(false);
        setUser(null);
      }
    }

    loadUser();

    function handleAuthChange() {
      loadUser();
    }

    window.addEventListener("auth-change", handleAuthChange);

    return () => {
      window.removeEventListener(
        "auth-change",
        handleAuthChange
      );
    };
  }, []);

  // Close dropdown when clicking anywhere outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setProfileOpen(false);
      }
    }

    document.addEventListener("click", handleClickOutside);

    return () => {
      document.removeEventListener(
        "click",
        handleClickOutside
      );
    };
  }, []);

  async function handleLogout() {
    try {
      await logout();
    } catch {
      // Continue logout even if backend request fails
    }

    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("verification_email");

    setIsLoggedIn(false);
    setUser(null);
    setProfileOpen(false);

    window.location.href = "/";
  }

  // Get initials for profile avatar
  function getInitials() {
    const name = user?.full_name?.trim();

    if (name) {
      const parts = name.split(" ");

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

  return (
    <header className="sticky top-0 z-50 border-b bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
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

        {/* Desktop Navigation */}
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

        {/* Search */}
        <div className="hidden w-64 lg:block">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />

            <Input
              placeholder="Search products..."
              className="pl-9"
            />
          </div>
        </div>

        {/* Desktop Actions */}
        <div className="hidden items-center gap-2 md:flex">

          {/* Cart */}
          <Button
            variant="ghost"
            size="icon"
            asChild
          >
            <Link href="/cart">
              <ShoppingCart className="h-5 w-5" />
            </Link>
          </Button>

          {/* Logged Out */}
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

            /* Logged In */
            <div
              ref={profileRef}
              className="relative"
            >

              {/* User Button */}
              <Button
                variant="ghost"
                onClick={() =>
                  setProfileOpen((prev) => !prev)
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

              {/* User Dropdown */}
              {profileOpen && (
                <div className="absolute right-0 top-12 w-72 rounded-lg border bg-white p-2 shadow-lg">

                  {/* User Photo + Name + Email + Role */}
                  <div className="flex items-center gap-3 px-3 py-3">

                    {/* Profile Photo Button */}
                    <button
                      type="button"
                      className="group relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border bg-gray-100 text-lg font-semibold uppercase"
                      aria-label="Profile photo"
                    >
                      {getInitials()}

                      {/* Camera Icon */}
                      <span className="absolute inset-0 flex items-center justify-center bg-black/50 text-white opacity-0 transition group-hover:opacity-100">
                        <Camera className="h-5 w-5" />
                      </span>
                    </button>

                    {/* Name + Email + Role */}
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

                  {/* Orders */}
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

                  {/* Wishlist */}
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

                  {/* Logout */}
                  <button
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

        {/* Mobile Menu Button */}
        <button
          className="md:hidden"
          onClick={() =>
            setMobileMenu(!mobileMenu)
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

      {/* Mobile Menu */}
      {mobileMenu && (
        <div className="border-t bg-white px-4 py-4 md:hidden">

          <nav className="flex flex-col gap-4">

            <Link
              href="/"
              onClick={() =>
                setMobileMenu(false)
              }
              className="text-sm font-medium"
            >
              Home
            </Link>

            <Link
              href="/products"
              onClick={() =>
                setMobileMenu(false)
              }
              className="text-sm font-medium"
            >
              Products
            </Link>

            <Link
              href="/categories"
              onClick={() =>
                setMobileMenu(false)
              }
              className="text-sm font-medium"
            >
              Categories
            </Link>

            <Link
              href="/ai-assistant"
              onClick={() =>
                setMobileMenu(false)
              }
              className="text-sm font-medium"
            >
              AI Assistant
            </Link>

            <Link
              href="/cart"
              onClick={() =>
                setMobileMenu(false)
              }
              className="text-sm font-medium"
            >
              Cart
            </Link>

            {/* Mobile Logged Out */}
            {!isLoggedIn ? (
              <>
                <Link
                  href="/login"
                  onClick={() =>
                    setMobileMenu(false)
                  }
                  className="text-sm font-medium"
                >
                  Login
                </Link>

                <Link
                  href="/signup"
                  onClick={() =>
                    setMobileMenu(false)
                  }
                  className="text-sm font-medium"
                >
                  Sign Up
                </Link>
              </>
            ) : (
              <>
                {/* Mobile User */}
                <div className="border-t pt-4">

                  <div className="flex items-center gap-3">

                    {/* Mobile Profile Photo */}
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

                    {/* Mobile Name + Email + Role */}
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

                {/* Orders */}
                <Link
                  href="/orders"
                  onClick={() =>
                    setMobileMenu(false)
                  }
                  className="flex items-center gap-2 text-sm font-medium"
                >
                  <Package className="h-4 w-4" />
                  My Orders
                </Link>

                {/* Wishlist */}
                <Link
                  href="/wishlist"
                  onClick={() =>
                    setMobileMenu(false)
                  }
                  className="flex items-center gap-2 text-sm font-medium"
                >
                  <Heart className="h-4 w-4" />
                  Wishlist
                </Link>

                {/* Logout */}
                <button
                  onClick={() => {
                    setMobileMenu(false);
                    handleLogout();
                  }}
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