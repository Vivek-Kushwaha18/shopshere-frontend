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
  Save,
  X,
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
  changeEmail,
  clearAuthSession,
  getMyProfile,
  getStoredUser,
  updateMyProfile,
  verifyEmailChange,
  type User as AuthUser,
  type UserGender,
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

function formatGender(
  gender: UserGender | null
) {
  switch (gender) {
    case "male":
      return "Male";

    case "female":
      return "Female";

    case "other":
      return "Other";

    case "prefer_not_to_say":
      return "Prefer not to say";

    default:
      return "Not specified";
  }
}

export default function ProfilePage() {
  const router = useRouter();

  const [user, setUser] =
    useState<AuthUser | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [editing, setEditing] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [fullName, setFullName] =
    useState("");

  const [phone, setPhone] =
    useState("");

  const [gender, setGender] =
    useState<UserGender | null>(null);

  const [newEmail, setNewEmail] =
    useState("");

  const [emailChanging, setEmailChanging] =
    useState(false);

  const [emailVerificationSent, setEmailVerificationSent] =
    useState(false);

  const [emailCode, setEmailCode] =
    useState("");

  const [emailVerifying, setEmailVerifying] =
    useState(false);

  useEffect(() => {
    async function loadProfile() {
      const storedUser = getStoredUser();

      if (!storedUser) {
        router.replace("/login");
        return;
      }

      try {
        setLoading(true);
        setError("");

        const result = await getMyProfile();

        if (!result.success) {
          throw new Error(
            result.data?.detail ||
              "Unable to load profile."
          );
        }

        const profile = result.data as AuthUser;

        setUser(profile);

        setFullName(profile.full_name);
        setPhone(profile.phone || "");
        setGender(profile.gender);
        setNewEmail(profile.email);

        localStorage.setItem(
          "user",
          JSON.stringify(profile)
        );
      } catch (error) {
        console.error(
          "Profile loading error:",
          error
        );

        setUser(storedUser);

        setFullName(storedUser.full_name);
        setPhone(storedUser.phone || "");
        setGender(storedUser.gender);
        setNewEmail(storedUser.email);

        setError(
          error instanceof Error
            ? error.message
            : "Unable to load profile."
        );
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [router]);

  function startEditing() {
    if (!user) {
      return;
    }

    setFullName(user.full_name);
    setPhone(user.phone || "");
    setGender(user.gender);

    setError("");
    setSuccess("");
    setEditing(true);
  }

  function cancelEditing() {
    if (!user) {
      return;
    }

    setFullName(user.full_name);
    setPhone(user.phone || "");
    setGender(user.gender);

    setError("");
    setSuccess("");
    setEditing(false);
  }

  async function saveProfile() {
    if (!user) {
      return;
    }

    if (fullName.trim().length < 2) {
      setError(
        "Full name must contain at least 2 characters."
      );
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const result = await updateMyProfile({
        full_name: fullName,
        phone: phone || null,
        gender,
      });

      if (!result.success) {
        throw new Error(
          result.data?.detail ||
            "Unable to update profile."
        );
      }

      const updatedUser =
        result.data as AuthUser;

      setUser(updatedUser);

      setFullName(updatedUser.full_name);
      setPhone(updatedUser.phone || "");
      setGender(updatedUser.gender);

      localStorage.setItem(
        "user",
        JSON.stringify(updatedUser)
      );

      window.dispatchEvent(
        new Event("auth-change")
      );

      setEditing(false);
      setSuccess(
        "Profile updated successfully."
      );
    } catch (error) {
      console.error(
        "Profile update error:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Unable to update profile."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleChangeEmail() {
    if (!user) {
      return;
    }

    const email =
      newEmail.trim().toLowerCase();

    if (!email) {
      setError("Please enter an email address.");
      return;
    }

    if (email === user.email.toLowerCase()) {
      setError(
        "Please enter a different email address."
      );
      return;
    }

    try {
      setEmailChanging(true);
      setError("");
      setSuccess("");

      const result =
        await changeEmail(email);

      if (!result.success) {
        throw new Error(
          result.data?.detail ||
            "Unable to send email verification code."
        );
      }

      setEmailVerificationSent(true);

      setSuccess(
        "Verification code sent to your new email address."
      );
    } catch (error) {
      console.error(
        "Change email error:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Unable to change email."
      );
    } finally {
      setEmailChanging(false);
    }
  }

  async function handleVerifyEmailChange() {
    if (emailCode.trim().length !== 6) {
      setError(
        "Please enter the 6-digit verification code."
      );
      return;
    }

    try {
      setEmailVerifying(true);
      setError("");
      setSuccess("");

      const result =
        await verifyEmailChange(
          emailCode.trim()
        );

      if (!result.success) {
        throw new Error(
          result.data?.detail ||
            "Unable to verify email."
        );
      }

      const updatedUser =
        result.data as AuthUser;

      setUser(updatedUser);

      setNewEmail(updatedUser.email);

      localStorage.setItem(
        "user",
        JSON.stringify(updatedUser)
      );

      window.dispatchEvent(
        new Event("auth-change")
      );

      setEmailCode("");
      setEmailVerificationSent(false);

      setSuccess(
        "Email updated successfully."
      );
    } catch (error) {
      console.error(
        "Email verification error:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Unable to verify email."
      );
    } finally {
      setEmailVerifying(false);
    }
  }

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

        {/* Messages */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
            {success}
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-3">

          {/* Profile Card */}
          <Card className="md:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>
                Personal Information
              </CardTitle>

              {!editing ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={startEditing}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={cancelEditing}
                    disabled={saving}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>

                  <Button
                    size="sm"
                    onClick={saveProfile}
                    disabled={saving}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {saving
                      ? "Saving..."
                      : "Save"}
                  </Button>
                </div>
              )}
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

              {!editing ? (
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

                  {/* Gender */}
                  <div className="flex items-start gap-3">
                    <User className="mt-1 h-5 w-5 text-muted-foreground" />

                    <div>
                      <p className="text-sm text-muted-foreground">
                        Gender
                      </p>

                      <p className="font-medium">
                        {formatGender(user.gender)}
                      </p>
                    </div>
                  </div>

                  {/* Role */}
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="mt-1 h-5 w-5 text-muted-foreground" />

                    <div>
                      <p className="text-sm text-muted-foreground">
                        Role
                      </p>

                      <p className="font-medium">
                        {roleLabel}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-5">

                  {/* Full Name */}
                  <div>
                    <label
                      htmlFor="full_name"
                      className="mb-2 block text-sm font-medium"
                    >
                      Full Name
                    </label>

                    <input
                      id="full_name"
                      type="text"
                      value={fullName}
                      onChange={(event) =>
                        setFullName(
                          event.target.value
                        )
                      }
                      minLength={2}
                      maxLength={100}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label
                      htmlFor="phone"
                      className="mb-2 block text-sm font-medium"
                    >
                      Phone
                    </label>

                    <input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(event) =>
                        setPhone(
                          event.target.value
                        )
                      }
                      maxLength={20}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                    />
                  </div>

                  {/* Gender */}
                  <div>
                    <label
                      htmlFor="gender"
                      className="mb-2 block text-sm font-medium"
                    >
                      Gender
                    </label>

                    <select
                      id="gender"
                      value={gender || ""}
                      onChange={(event) =>
                        setGender(
                          event.target.value
                            ? (event.target.value as UserGender)
                            : null
                        )
                      }
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                    >
                      <option value="">
                        Not specified
                      </option>

                      <option value="male">
                        Male
                      </option>

                      <option value="female">
                        Female
                      </option>

                      <option value="other">
                        Other
                      </option>

                      <option value="prefer_not_to_say">
                        Prefer not to say
                      </option>
                    </select>
                  </div>
                </div>
              )}
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

              <Button
                variant="outline"
                className="w-full justify-start"
                disabled
              >
                <MapPin className="mr-3 h-4 w-4" />
                My Addresses
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

        {/* Change Email */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>
              Email Address
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="flex items-start gap-3">
              <Mail className="mt-1 h-5 w-5 text-muted-foreground" />

              <div className="w-full">
                <p className="text-sm text-muted-foreground">
                  Current Email
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

                <Separator className="my-5" />

                <label
                  htmlFor="new_email"
                  className="mb-2 block text-sm font-medium"
                >
                  New Email
                </label>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <input
                    id="new_email"
                    type="email"
                    value={newEmail}
                    onChange={(event) =>
                      setNewEmail(
                        event.target.value
                      )
                    }
                    disabled={
                      emailVerificationSent
                    }
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                  />

                  {!emailVerificationSent && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={
                        handleChangeEmail
                      }
                      disabled={
                        emailChanging
                      }
                    >
                      {emailChanging
                        ? "Sending..."
                        : "Change Email"}
                    </Button>
                  )}
                </div>

                {emailVerificationSent && (
                  <div className="mt-5 rounded-lg border border-gray-200 bg-muted/30 p-4">
                    <p className="text-sm font-medium">
                      Verify your new email
                    </p>

                    <p className="mt-1 text-xs text-muted-foreground">
                      Enter the 6-digit code sent
                      to your new email address.
                    </p>

                    <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={emailCode}
                        onChange={(event) =>
                          setEmailCode(
                            event.target.value.replace(
                              /\D/g,
                              ""
                            )
                          )
                        }
                        placeholder="Enter 6-digit code"
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                      />

                      <Button
                        type="button"
                        onClick={
                          handleVerifyEmailChange
                        }
                        disabled={
                          emailVerifying
                        }
                      >
                        {emailVerifying
                          ? "Verifying..."
                          : "Verify Email"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

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

              {/* User ID */}
              <div>
                <p className="text-sm text-muted-foreground">
                  User ID
                </p>

                <p className="mt-1 font-medium">
                  {user.id}
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