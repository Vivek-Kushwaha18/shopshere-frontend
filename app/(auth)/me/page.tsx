"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getMe } from "@/services/auth";

export default function MePage() {
const [user, setUser] = useState<any>(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState("");

useEffect(() => {
const fetchUser = async () => {
try {
const token =
localStorage.getItem("access_token") ||
sessionStorage.getItem("access_token");

    if (!token) {
      setError("You are not logged in.");
      return;
    }

    const result = await getMe();

    console.log("Current user:", result);

    setUser(result);
  } catch (error) {
    if (error instanceof Error) {
      setError(error.message);
    } else {
      setError("Unable to load user.");
    }
  } finally {
    setLoading(false);
  }
};

fetchUser();

}, []);



return ( <div className="flex min-h-[calc(100vh-128px)] items-center justify-center bg-gray-50 px-6 py-12"> <div className="w-full max-w-md rounded-2xl border bg-white p-8 shadow-sm">


    <h1 className="mb-6 text-center text-3xl font-bold">
      My Profile
    </h1>

    {error && (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
        {error}
      </div>
    )}

    {user && (
      <div className="space-y-4">

        <div>
          <p className="text-sm text-gray-500">
            Full Name
          </p>

          <p className="font-medium">
            {user.full_name || "N/A"}
          </p>
        </div>

        <div>
          <p className="text-sm text-gray-500">
            Email
          </p>

          <p className="font-medium">
            {user.email || "N/A"}
          </p>
        </div>

        <div>
          <p className="text-sm text-gray-500">
            Phone
          </p>

          <p className="font-medium">
            {user.phone || "N/A"}
          </p>
        </div>

        <div>
          <p className="text-sm text-gray-500">
            Role
          </p>

          <p className="font-medium">
            {user.role || "N/A"}
          </p>
        </div>

      </div>
    )}

    <div className="mt-8 text-center">
      <Link
        href="/"
        className="font-medium text-black hover:underline"
      >
        ← Back to Home
      </Link>
    </div>

  </div>
</div>

);
}
