
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Swal from "sweetalert2";

import {
  User,
  Mail,
  Phone,
  Package,
  ShoppingBag,
  Boxes,
  BarChart3,
  LogOut,
  Pencil,
  ShieldCheck,
  Save,
  X,
  Wallet,
  LineChart,
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
  getMyProfile,
  getStoredUser,
  logoutSession,
  updateMyProfile,
  updateStoredUser,
  verifyEmailChange,
  type User as AuthUser,
  type UserGender,
} from "@/services/auth";

// =====================================================
// HELPERS
// =====================================================

function formatGender(gender?: UserGender | null): string {
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

function getApiErrorMessage(
  response: unknown,
  fallback: string
): string {
  if (!response || typeof response !== "object") {
    return fallback;
  }

  const result = response as {
    data?: unknown;
    message?: unknown;
  };

  if (result.data && typeof result.data === "object") {
    const data = result.data as {
      detail?: unknown;
      message?: unknown;
    };

    if (
      typeof data.detail === "string" &&
      data.detail.trim()
    ) {
      return data.detail;
    }

    if (Array.isArray(data.detail)) {
      const messages = data.detail
        .map((item: unknown) => {
          if (
            item &&
            typeof item === "object" &&
            "msg" in item &&
            typeof item.msg === "string"
          ) {
            return item.msg;
          }

          return "";
        })
        .filter(Boolean);

      if (messages.length > 0) {
        return messages.join(", ");
      }
    }

    if (
      typeof data.message === "string" &&
      data.message.trim()
    ) {
      return data.message;
    }
  }

  if (
    typeof result.message === "string" &&
    result.message.trim()
  ) {
    return result.message;
  }

  return fallback;
}

// =====================================================
// SELLER PROFILE PAGE
// =====================================================

export default function SellerProfilePage() {
  const router = useRouter();

  const [user, setUser] = useState<AuthUser | null>(
    () => getStoredUser()
  );

  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [fullName, setFullName] = useState(
    () => getStoredUser()?.full_name || ""
  );

  const [phone, setPhone] = useState(
    () => getStoredUser()?.phone || ""
  );

  const [gender, setGender] = useState<UserGender | null>(
    () => getStoredUser()?.gender || null
  );

  const [newEmail, setNewEmail] = useState(
    () => getStoredUser()?.email || ""
  );

  const [emailChanging, setEmailChanging] = useState(false);

  const [emailVerificationSent, setEmailVerificationSent] =
    useState(false);

  const [emailCode, setEmailCode] = useState("");
  const [emailVerifying, setEmailVerifying] = useState(false);

  // =====================================================
  // LOAD PROFILE
  // =====================================================

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      const storedUser = getStoredUser();

      if (!storedUser) {
        router.replace("/login");
        return;
      }

      if (storedUser.role !== "seller") {
        router.replace("/seller/dashboard");
        return;
      }

      setUser(storedUser);
      setFullName(storedUser.full_name || "");
      setPhone(storedUser.phone || "");
      setGender(storedUser.gender || null);
      setNewEmail(storedUser.email || "");

      try {
        setLoading(true);
        setError("");

        const result = await getMyProfile();

        if (!isMounted) return;

        if (!result.success) {
          throw new Error(
            getApiErrorMessage(
              result,
              "Unable to load profile."
            )
          );
        }

        const profile = result.data as AuthUser;

        if (profile.role !== "seller") {
          router.replace("/seller/dashboard");
          return;
        }

        setUser(profile);
        setFullName(profile.full_name || "");
        setPhone(profile.phone || "");
        setGender(profile.gender || null);
        setNewEmail(profile.email || "");

        updateStoredUser(profile);
      } catch (err: unknown) {
        if (!isMounted) return;

        console.error("Seller profile loading error:", err);

        setUser(storedUser);
        setFullName(storedUser.full_name || "");
        setPhone(storedUser.phone || "");
        setGender(storedUser.gender || null);
        setNewEmail(storedUser.email || "");

        setError(
          err instanceof Error
            ? err.message
            : "Unable to refresh profile."
        );
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void loadProfile();

    return () => {
      isMounted = false;
    };
  }, [router]);

  // =====================================================
  // START EDITING
  // =====================================================

  function startEditing() {
    if (!user) return;

    setFullName(user.full_name || "");
    setPhone(user.phone || "");
    setGender(user.gender || null);

    setError("");
    setSuccess("");
    setEditing(true);
  }

  // =====================================================
  // CANCEL EDITING
  // =====================================================

  function cancelEditing() {
    if (!user) return;

    setFullName(user.full_name || "");
    setPhone(user.phone || "");
    setGender(user.gender || null);

    setError("");
    setSuccess("");
    setEditing(false);
  }

  // =====================================================
  // SAVE PROFILE
  // =====================================================

  async function saveProfile() {
    if (!user || saving) return;

    const trimmedName = fullName.trim();

    if (trimmedName.length < 2) {
      setError("Full name must contain at least 2 characters.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const result = await updateMyProfile({
        full_name: trimmedName,
        phone: phone.trim() || null,
        gender,
      });

      if (!result.success) {
        throw new Error(
          getApiErrorMessage(
            result,
            "Unable to update profile."
          )
        );
      }

      const updatedUser = result.data as AuthUser;

      setUser(updatedUser);
      setFullName(updatedUser.full_name || "");
      setPhone(updatedUser.phone || "");
      setGender(updatedUser.gender || null);
      setNewEmail(updatedUser.email || "");

      updateStoredUser(updatedUser);

      setEditing(false);
      setSuccess("Profile updated successfully.");
    } catch (err: unknown) {
      console.error("Seller profile update error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to update profile."
      );
    } finally {
      setSaving(false);
    }
  }

  // =====================================================
  // REQUEST EMAIL CHANGE
  // =====================================================

  async function handleChangeEmail() {
    if (!user || emailChanging || emailVerifying) return;

    const email = newEmail.trim().toLowerCase();

    if (!email) {
      setError("Please enter an email address.");
      return;
    }

    if (email === user.email.toLowerCase()) {
      setError("Please enter a different email address.");
      return;
    }

    try {
      setEmailChanging(true);
      setError("");
      setSuccess("");

      const result = await changeEmail(email);

      if (!result.success) {
        throw new Error(
          getApiErrorMessage(
            result,
            "Unable to send email verification code."
          )
        );
      }

      setNewEmail(email);
      setEmailVerificationSent(true);
      setEmailCode("");

      setSuccess(
        "Verification code sent to your new email address."
      );
    } catch (err: unknown) {
      console.error("Seller change email error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to change email."
      );
    } finally {
      setEmailChanging(false);
    }
  }

  // =====================================================
  // VERIFY EMAIL CHANGE
  // =====================================================

  async function handleVerifyEmailChange() {
    if (!user || emailVerifying || emailChanging) return;

    const email = newEmail.trim().toLowerCase();
    const code = emailCode.trim();

    if (!email) {
      setError("Please enter your new email address.");
      return;
    }

    if (!/^\d{6}$/.test(code)) {
      setError("Please enter the 6-digit verification code.");
      return;
    }

    try {
      setEmailVerifying(true);
      setError("");
      setSuccess("");

      const result = await verifyEmailChange({
        email,
        code,
      });

      if (!result.success) {
        throw new Error(
          getApiErrorMessage(
            result,
            "Unable to verify email."
          )
        );
      }

      const updatedUser = result.data as AuthUser;

      setUser(updatedUser);
      setNewEmail(updatedUser.email || "");
      setEmailCode("");
      setEmailVerificationSent(false);

      updateStoredUser(updatedUser);

      setSuccess("Email updated successfully.");
    } catch (err: unknown) {
      console.error("Seller email verification error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to verify email."
      );
    } finally {
      setEmailVerifying(false);
    }
  }

  // =====================================================
  // LOGOUT
  // =====================================================

  async function logout() {
    try {
      await logoutSession();
    } catch (error) {
      console.error("Unable to revoke the logout session:", error);
      await Swal.fire({
        icon: "error",
        title: "Logout failed",
        text:
          error instanceof Error
            ? error.message
            : "Please try again.",
      });
      router.replace("/login");
      return;
    }

    router.replace("/login");
  }

  // =====================================================
  // NO USER
  // =====================================================

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30">
        <p className="text-sm text-muted-foreground">
          {loading
            ? "Loading profile..."
            : "Redirecting to login..."}
        </p>
      </div>
    );
  }

  // =====================================================
  // PAGE UI
  // =====================================================

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">
            Seller Profile
          </h1>

          <p className="mt-2 text-muted-foreground">
            Manage your seller account and profile information.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {success && (
          <div
            role="status"
            className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700"
          >
            {success}
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-3">
          {/* Personal Information */}

          <Card className="md:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Personal Information</CardTitle>

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
                    {saving ? "Saving..." : "Save"}
                  </Button>
                </div>
              )}
            </CardHeader>

            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                  <User className="h-10 w-10 text-primary" />
                </div>

                <div>
                  <h2 className="text-xl font-semibold">
                    {user.full_name}
                  </h2>

                  <p className="text-sm text-muted-foreground">
                    Seller
                  </p>
                </div>
              </div>

              <Separator className="my-6" />

              {!editing ? (
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="flex items-start gap-3">
                    <Mail className="mt-1 h-5 w-5 text-muted-foreground" />

                    <div>
                      <p className="text-sm text-muted-foreground">
                        Email
                      </p>

                      <p className="break-all font-medium">
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

                  <div className="flex items-start gap-3">
                    <ShieldCheck className="mt-1 h-5 w-5 text-muted-foreground" />

                    <div>
                      <p className="text-sm text-muted-foreground">
                        Role
                      </p>

                      <p className="font-medium">Seller</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
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
                        setFullName(event.target.value)
                      }
                      minLength={2}
                      maxLength={100}
                      autoComplete="name"
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                    />
                  </div>

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
                        setPhone(event.target.value)
                      }
                      maxLength={20}
                      autoComplete="tel"
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                    />
                  </div>

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
                      <option value="">Not specified</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
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
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>

            <CardContent className="space-y-3">
              <Link
                href="/seller/dashboard/products"
                className="block"
              >
                <Button
                  variant="outline"
                  className="w-full justify-start"
                >
                  <Package className="mr-3 h-4 w-4" />
                  Products
                </Button>
              </Link>

              <Link
                href="/seller/dashboard/revenue"
                className="block"
              >
                <Button
                  variant="outline"
                  className="w-full justify-start"
                >
                  <Wallet className="mr-3 h-4 w-4" />
                  Revenue
                </Button>
              </Link>

              <Link
                href="/seller/dashboard/inventory"
                className="block"
              >
                <Button
                  variant="outline"
                  className="w-full justify-start"
                >
                  <Boxes className="mr-3 h-4 w-4" />
                  Inventory
                </Button>
              </Link>

              <Link
                href="/seller/dashboard/orders"
                className="block"
              >
                <Button
                  variant="outline"
                  className="w-full justify-start"
                >
                  <ShoppingBag className="mr-3 h-4 w-4" />
                  Orders
                </Button>
              </Link>

              <Link
                href="/seller/dashboard/analytics"
                className="block"
              >
                <Button
                  variant="outline"
                  className="w-full justify-start"
                >
                  <LineChart className="mr-3 h-4 w-4" />
                  Analytics
                </Button>
              </Link>

              <Link href="/seller/dashboard" className="block">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                >
                  <BarChart3 className="mr-3 h-4 w-4" />
                  Seller Dashboard
                </Button>
              </Link>

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
            <CardTitle>Email Address</CardTitle>
          </CardHeader>

          <CardContent>
            <div className="flex items-start gap-3">
              <Mail className="mt-1 h-5 w-5 text-muted-foreground" />

              <div className="w-full">
                <p className="text-sm text-muted-foreground">
                  Current Email
                </p>

                <p className="break-all font-medium">
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
                      setNewEmail(event.target.value)
                    }
                    disabled={
                      emailVerificationSent ||
                      emailChanging ||
                      emailVerifying
                    }
                    autoComplete="email"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                  />

                  {!emailVerificationSent && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleChangeEmail}
                      disabled={emailChanging || emailVerifying}
                    >
                      {emailChanging ? "Sending..." : "Change Email"}
                    </Button>
                  )}
                </div>

                {emailVerificationSent && (
                  <div className="mt-5 rounded-lg border border-gray-200 bg-muted/30 p-4">
                    <p className="text-sm font-medium">
                      Verify your new email
                    </p>

                    <p className="mt-1 text-xs text-muted-foreground">
                      Enter the 6-digit code sent to your new email address.
                    </p>

                    <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                      <input
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        maxLength={6}
                        value={emailCode}
                        onChange={(event) =>
                          setEmailCode(
                            event.target.value.replace(/\D/g, "")
                          )
                        }
                        placeholder="Enter 6-digit code"
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                      />

                      <Button
                        type="button"
                        onClick={handleVerifyEmailChange}
                        disabled={emailVerifying || emailChanging}
                      >
                        {emailVerifying
                          ? "Verifying..."
                          : "Verify Email"}
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setEmailVerificationSent(false);
                          setEmailCode("");
                          setNewEmail(user.email);
                          setError("");
                          setSuccess("");
                        }}
                        disabled={emailVerifying || emailChanging}
                      >
                        Cancel
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
            <CardTitle>Account Information</CardTitle>
          </CardHeader>

          <CardContent>
            <div className="grid gap-6 sm:grid-cols-3">
              <div>
                <p className="text-sm text-muted-foreground">
                  Account Type
                </p>

                <p className="mt-1 font-medium">Seller</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">
                  User ID
                </p>

                <p className="mt-1 font-medium">{user.id}</p>
              </div>

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
                  {user.is_active ? "Active" : "Inactive"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Security */}

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Account Security</CardTitle>
          </CardHeader>

          <CardContent>
            <div className="flex items-center gap-3">
              <ShieldCheck
                className={`h-6 w-6 ${
                  user.is_verified
                    ? "text-green-600"
                    : "text-orange-600"
                }`}
              />

              <div>
                <p className="font-medium">Email Verification</p>

                <p
                  className={`text-sm ${
                    user.is_verified
                      ? "text-green-600"
                      : "text-orange-600"
                  }`}
                >
                  {user.is_verified
                    ? "Your email address is verified."
                    : "Your email address is not verified."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
