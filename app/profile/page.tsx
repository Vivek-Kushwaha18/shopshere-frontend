"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import {
  User,
  Mail,
  Phone,
  Package,
  Heart,
  MapPin,
  Settings,
  LogOut,
  Pencil,
  ShieldCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import {
  clearAuthSession,
  getStoredUser,
  type User as AuthUser,
} from "@/services/auth";

function formatRole(role: AuthUser["role"]) {
  switch (role) {
    case "admin":
      return "Admin";
    case "seller":
      return "Seller";
    default:
      return "Customer";
  }
}

export default function ProfilePage() {
  const router = useRouter();

  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = getStoredUser();

    if (!storedUser) {
      router.replace("/login");
      return;
    }

    setUser(storedUser);
    setLoading(false);
  }, [router]);

  function logout() {
    clearAuthSession();
    router.replace("/");
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30">
        <p className="text-muted-foreground">
          Loading profile...
        </p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const roleLabel = formatRole(user.role);

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="mx-auto max-w-5xl px-4 py-10">

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">
            My Profile
          </h1>

          <p className="mt-2 text-muted-foreground">
            Manage your account and view your activity.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">

          {/* Profile Card */}
          <Card className="md:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>
                Personal Information
              </CardTitle>

              <Button
                variant="outline"
                size="sm"
                disabled
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Button>
            </CardHeader>

            <CardContent>

              {/* User Header */}
              <div className="flex items-center gap-4">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                  <User className="h-10 w-10 text-primary" />
                </div>

                <div>
                  <h2 className="text-xl font-semibold">
                    {user.full_name}
                  </h2>

                  <p className="text-sm text-muted-foreground">
                    {roleLabel}
                  </p>
                </div>
              </div>

              <Separator className="my-6" />

              {/* User Details */}
              <div className="grid gap-5 sm:grid-cols-2">

                {/* Email */}
                <div className="flex items-start gap-3">
                  <Mail className="mt-1 h-5 w-5 text-muted-foreground" />

                  <div>
                    <p className="text-sm text-muted-foreground">
                      Email
                    </p>

                    <p className="font-medium break-all">
                      {user.email}
                    </p>

                    {user.is_verified && (
                      <div className="mt-1 flex items-center gap-1 text-xs text-green-600">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Verified
                      </div>
                    )}
                  </div>
                </div>

                {/* Phone */}
                <div className="flex items-start gap-3">
                  <Phone className="mt-1 h-5 w-5 text-muted-foreground" />

                  <div>
                    <p className="text-sm text-muted-foreground">
                      Phone
                    </p>

                    <p className="font-medium">
                      {user.phone || "Not added"}
                    </p>
                  </div>
                </div>

              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>
                Quick Actions
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-3">

              {/* Orders */}
              <Link
                href="/orders"
                className="block"
              >
                <Button
                  variant="outline"
                  className="w-full justify-start"
                >
                  <Package className="mr-3 h-4 w-4" />
                  My Orders
                </Button>
              </Link>

              {/* Wishlist */}
              <Link
                href="/wishlist"
                className="block"
              >
                <Button
                  variant="outline"
                  className="w-full justify-start"
                >
                  <Heart className="mr-3 h-4 w-4" />
                  Wishlist
                </Button>
              </Link>

              {/* Addresses */}
              <Button
                variant="outline"
                className="w-full justify-start"
                disabled
              >
                <MapPin className="mr-3 h-4 w-4" />
                My Addresses
              </Button>

              {/* Settings */}
              <Button
                variant="outline"
                className="w-full justify-start"
                disabled
              >
                <Settings className="mr-3 h-4 w-4" />
                Account Settings
              </Button>

              <Separator />

              {/* Logout */}
              <Button
                variant="destructive"
                className="w-full justify-start"
                onClick={logout}
              >
                <LogOut className="mr-3 h-4 w-4" />
                Logout
              </Button>

            </CardContent>
          </Card>
        </div>

        {/* Account Information */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>
              Account Information
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="grid gap-6 sm:grid-cols-3">

              {/* Account Type */}
              <div>
                <p className="text-sm text-muted-foreground">
                  Account Type
                </p>

                <p className="mt-1 font-medium">
                  {roleLabel}
                </p>
              </div>

              {/* Member Since */}
              <div>
                <p className="text-sm text-muted-foreground">
                  Member Since
                </p>

                <p className="mt-1 font-medium">
                  Recently joined
                </p>
              </div>

              {/* Account Status */}
              <div>
                <p className="text-sm text-muted-foreground">
                  Account Status
                </p>

                <p
                  className={`mt-1 font-medium ${
                    user.is_active
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {user.is_active
                    ? "Active"
                    : "Inactive"}
                </p>
              </div>

            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
} 