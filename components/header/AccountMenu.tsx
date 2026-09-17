"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface AccountMenuProps {
  name: string;
}

export default function AccountMenu({
  name,
}: AccountMenuProps) {
  const [open, setOpen] =
    useState(false);

  const router = useRouter();

  function logout() {
    localStorage.removeItem(
      "access_token"
    );

    localStorage.removeItem(
      "refresh_token"
    );

    localStorage.removeItem("user");

    setOpen(false);

    router.push("/");
    router.refresh();
  }

  return (
    <div className="relative">
      <button
        onClick={() =>
          setOpen(!open)
        }
        className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-blue-700"
      >
        👤 {name}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-52 rounded-md border bg-white py-2 shadow-lg">
          <Link
            href="/profile"
            className="block px-4 py-2 text-sm hover:bg-gray-100"
          >
            Profile
          </Link>

          <Link
            href="/customer/dashboard"
            className="block px-4 py-2 text-sm hover:bg-gray-100"
          >
            Dashboard
          </Link>

          <Link
            href="/change-password"
            className="block px-4 py-2 text-sm hover:bg-gray-100"
          >
            Change Password
          </Link>

          <Link
            href="/update-password"
            className="block px-4 py-2 text-sm hover:bg-gray-100"
          >
            Update Password
          </Link>

          <button
            onClick={logout}
            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
}