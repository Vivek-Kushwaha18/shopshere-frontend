"use client";

import { useEffect, useState } from "react";
import { getProfile } from "@/services/auth";
import { User } from "@/types/auth";

export default function ProfilePage() {
  const [user, setUser] =
    useState<User | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    async function loadProfile() {
      const token =
        localStorage.getItem(
          "access_token"
        );

      if (!token) {
        setError(
          "Please login first."
        );

        setLoading(false);
        return;
      }

      try {
        const data =
          await getProfile(token);

        setUser(data);

        localStorage.setItem(
          "user",
          JSON.stringify(data)
        );
      } catch (err: any) {
        setError(
          err.message ||
            "Unable to load profile."
        );
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  if (loading) {
    return (
      <div className="p-10 text-center">
        Loading profile...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-10 text-center text-red-600">
        {error}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-2xl rounded-lg bg-white p-8 shadow">
        <h1 className="text-2xl font-bold">
          My Profile
        </h1>

        <div className="mt-6 space-y-5">
          <div>
            <p className="text-sm text-gray-500">
              Full Name
            </p>

            <p className="font-medium">
              {user?.full_name ||
                "Not available"}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Email
            </p>

            <p className="font-medium">
              {user?.email}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Phone
            </p>

            <p className="font-medium">
              {user?.phone ||
                "Not available"}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Account Type
            </p>

            <p className="font-medium capitalize">
              {user?.role}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}