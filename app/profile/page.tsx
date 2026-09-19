"use client";

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
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function ProfilePage() {
  function logout() {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("access_token");

    window.location.href = "/";
  }

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
              <CardTitle>Personal Information</CardTitle>

              <Button variant="outline" size="sm">
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Button>
            </CardHeader>

            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                  <User className="h-10 w-10 text-primary" />
                </div>

                <div>
                  <h2 className="text-xl font-semibold">
                    Your Name
                  </h2>

                  <p className="text-sm text-muted-foreground">
                    Customer
                  </p>
                </div>
              </div>

              <Separator className="my-6" />

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="flex items-start gap-3">
                  <Mail className="mt-1 h-5 w-5 text-muted-foreground" />

                  <div>
                    <p className="text-sm text-muted-foreground">
                      Email
                    </p>

                    <p className="font-medium">
                      your@email.com
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="mt-1 h-5 w-5 text-muted-foreground" />

                  <div>
                    <p className="text-sm text-muted-foreground">
                      Phone
                    </p>

                    <p className="font-medium">
                      Not added
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>

            <CardContent className="space-y-3">
              <Link href="/orders" className="block">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                >
                  <Package className="mr-3 h-4 w-4" />
                  My Orders
                </Button>
              </Link>

              <Link href="/wishlist" className="block">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                >
                  <Heart className="mr-3 h-4 w-4" />
                  Wishlist
                </Button>
              </Link>

              <Button
                variant="outline"
                className="w-full justify-start"
              >
                <MapPin className="mr-3 h-4 w-4" />
                My Addresses
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start"
              >
                <Settings className="mr-3 h-4 w-4" />
                Account Settings
              </Button>

              <Separator />

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
            <CardTitle>Account Information</CardTitle>
          </CardHeader>

          <CardContent>
            <div className="grid gap-6 sm:grid-cols-3">
              <div>
                <p className="text-sm text-muted-foreground">
                  Account Type
                </p>

                <p className="mt-1 font-medium">
                  Customer
                </p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">
                  Member Since
                </p>

                <p className="mt-1 font-medium">
                  Recently joined
                </p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">
                  Account Status
                </p>

                <p className="mt-1 font-medium text-green-600">
                  Active
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}