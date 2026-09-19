"use client";

import {
  FormEvent,
  useState,
} from "react";

import Link from "next/link";
import Swal from "sweetalert2";

import {
  Eye,
  EyeOff,
  Mail,
  Lock,
} from "lucide-react";

import {
  login,
  saveAuthSession,
} from "@/services/auth";

import { Button } from "@/components/ui/button";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";

export default function LoginPage() {
  const [showPassword, setShowPassword] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });

  // ==========================================
  // LOGIN SUBMIT
  // ==========================================

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (loading) {
      return;
    }

    const email =
      formData.email.trim().toLowerCase();

    const password =
      formData.password;

    // ==========================================
    // BASIC VALIDATION
    // ==========================================

    if (!email) {
      await Swal.fire({
        icon: "error",
        title: "Email required",
        text:
          "Please enter your email address.",
        confirmButtonText: "OK",
      });

      return;
    }

    if (!password) {
      await Swal.fire({
        icon: "error",
        title: "Password required",
        text:
          "Please enter your password.",
        confirmButtonText: "OK",
      });

      return;
    }

    setLoading(true);

    try {
      // ========================================
      // CALL LOGIN API
      // ========================================

      const response = await login({
        email,
        password,
      });

      console.log(
        "Login response:",
        response
      );

      // ========================================
      // LOGIN FAILED
      // ========================================

      if (!response.success) {
        await Swal.fire({
          icon: "error",
          title: "Login failed",
          text:
            response.data?.detail ||
            "Invalid email or password.",
          confirmButtonText: "OK",
        });

        return;
      }

      // ========================================
      // CHECK LOGIN RESPONSE
      // ========================================

      const accessToken =
        response.data?.access_token;

      const refreshToken =
        response.data?.refresh_token;

      const user =
        response.data?.user;

      if (
        !accessToken ||
        !refreshToken ||
        !user
      ) {
        console.error(
          "Invalid login response:",
          response.data
        );

        await Swal.fire({
          icon: "error",
          title: "Login error",
          text:
            "The server returned incomplete login information.",
          confirmButtonText: "OK",
        });

        return;
      }

      // ========================================
      // SAVE REAL AUTH SESSION
      // ========================================

      saveAuthSession({
        access_token: accessToken,
        refresh_token: refreshToken,
        user: user,
      });

      // ========================================
      // REMOVE OLD VERIFICATION DATA
      // ========================================

      sessionStorage.removeItem(
        "verification_email"
      );

      localStorage.removeItem(
        "verification_email"
      );

      // ========================================
      // REMEMBER ME
      // ========================================

      if (formData.rememberMe) {
        localStorage.setItem(
          "remember_me",
          "true"
        );
      } else {
        localStorage.removeItem(
          "remember_me"
        );
      }

      // ========================================
      // LOGIN SUCCESS
      // ========================================

      await Swal.fire({
        icon: "success",
        title: "Login successful!",
        text:
          `Welcome back, ${user.full_name}.`,
        confirmButtonText: "Continue",
      });

      // ========================================
      // GO TO HOME
      // ========================================
      //
      // Full browser navigation reloads
      // Header and reads the saved user.
      //

      window.location.href = "/";
    } catch (error) {
      console.error(
        "Login error:",
        error
      );

      await Swal.fire({
        icon: "error",
        title: "Connection Error",
        text:
          "Unable to connect to the server. Please try again.",
        confirmButtonText: "OK",
      });
    } finally {
      setLoading(false);
    }
  }

  // ==========================================
  // INPUT CHANGE
  // ==========================================

  function handleChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const {
      name,
      value,
    } = event.target;

    setFormData(
      (previous) => ({
        ...previous,
        [name]: value,
      })
    );
  }

  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-muted/30 px-4 py-10">
      <Card className="w-full max-w-md">

        {/* =====================================
            HEADER
        ====================================== */}

        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-2xl font-bold">
            Welcome back
          </CardTitle>

          <CardDescription>
            Login to your ShopSphere account.
          </CardDescription>
        </CardHeader>

        <CardContent>

          {/* =====================================
              LOGIN FORM
          ====================================== */}

          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >

            {/* EMAIL */}

            <div className="space-y-2">
              <Label htmlFor="email">
                Email Address
              </Label>

              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />

                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  className="pl-9"
                  required
                  disabled={loading}
                  autoComplete="email"
                />
              </div>
            </div>

            {/* PASSWORD */}

            <div className="space-y-2">

              <div className="flex items-center justify-between">

                <Label htmlFor="password">
                  Password
                </Label>

                <Link
                  href="/forgot-password"
                  className="text-sm font-medium underline underline-offset-4"
                >
                  Forgot password?
                </Link>

              </div>

              <div className="relative">

                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />

                <Input
                  id="password"
                  name="password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  className="pl-9 pr-10"
                  required
                  disabled={loading}
                  autoComplete="current-password"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      (previous) =>
                        !previous
                    )
                  }
                  className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>

              </div>
            </div>

            {/* REMEMBER ME */}

            <div className="flex items-center gap-3">

              <Checkbox
                id="rememberMe"
                name="rememberMe"
                checked={
                  formData.rememberMe
                }
                onCheckedChange={(
                  checked
                ) =>
                  setFormData(
                    (previous) => ({
                      ...previous,
                      rememberMe:
                        checked === true,
                    })
                  )
                }
                disabled={loading}
              />

              <Label
                htmlFor="rememberMe"
                className="text-sm font-normal"
              >
                Remember me
              </Label>

            </div>

            {/* LOGIN BUTTON */}

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={loading}
            >
              {loading
                ? "Logging in..."
                : "Login"}
            </Button>

          </form>

          {/* =====================================
              SEPARATOR
          ====================================== */}

          <div className="my-6 flex items-center gap-4">

            <Separator className="flex-1" />

            <span className="text-xs text-muted-foreground">
              OR
            </span>

            <Separator className="flex-1" />

          </div>

          {/* =====================================
              GOOGLE LOGIN
          ====================================== */}

          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={loading}
          >
            Continue with Google
          </Button>

          {/* =====================================
              SIGN UP
          ====================================== */}

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don't have an account?{" "}

            <Link
              href="/signup"
              className="font-medium text-foreground underline underline-offset-4"
            >
              Sign Up
            </Link>
          </p>

        </CardContent>
      </Card>
    </main>
  );
}