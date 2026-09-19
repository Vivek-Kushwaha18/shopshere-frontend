"use client";

import {
  FormEvent,
  Suspense,
  useState,
} from "react";

import Link from "next/link";

import {
  useRouter,
  useSearchParams,
} from "next/navigation";

import Swal from "sweetalert2";

import {
  Eye,
  EyeOff,
  Lock,
} from "lucide-react";

import { resetPassword } from "@/services/auth";

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


function ResetPasswordContent() {
  const router = useRouter();

  const searchParams = useSearchParams();

  /*
   * The backend should send the user to:
   *
   * /reset-password?token=YOUR_RESET_TOKEN
   *
   * We read that token here.
   */
  const token =
    searchParams.get("token");


  const [showPassword, setShowPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [loading, setLoading] =
    useState(false);


  const [formData, setFormData] =
    useState({
      password: "",
      confirmPassword: "",
    });


  function handleChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const {
      name,
      value,
    } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  }


  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (loading) {
      return;
    }


    /*
     * Token is required.
     *
     * If someone manually opens:
     *
     * /reset-password
     *
     * instead of:
     *
     * /reset-password?token=xxxxx
     *
     * we stop here.
     */
    if (!token) {
      await Swal.fire({
        icon: "error",
        title: "Invalid Reset Link",
        text:
          "This password reset link is invalid or missing. Please request a new password reset link.",
        confirmButtonText: "Go to Forgot Password",
      });

      router.push("/forgot-password");

      return;
    }


    if (
      !formData.password ||
      !formData.confirmPassword
    ) {
      await Swal.fire({
        icon: "error",
        title: "Missing Information",
        text:
          "Please enter your new password and confirm it.",
        confirmButtonText: "OK",
      });

      return;
    }


    if (
      formData.password.length < 8
    ) {
      await Swal.fire({
        icon: "error",
        title: "Weak Password",
        text:
          "Password must be at least 8 characters long.",
        confirmButtonText: "OK",
      });

      return;
    }


    if (
      formData.password !==
      formData.confirmPassword
    ) {
      await Swal.fire({
        icon: "error",
        title: "Passwords Do Not Match",
        text:
          "Please make sure both passwords are the same.",
        confirmButtonText: "OK",
      });

      return;
    }


    setLoading(true);


    try {
      const response =
        await resetPassword({
          token: token,
          new_password:
            formData.password,
        });


      console.log(
        "Reset password response:",
        response
      );


      if (!response.success) {
        await Swal.fire({
          icon: "error",
          title: "Password Reset Failed",
          text:
            response.data?.detail ||
            "This password reset link may have expired or is invalid.",
          confirmButtonText: "OK",
        });

        return;
      }


      await Swal.fire({
        icon: "success",
        title:
          "Password Reset Successful",
        text:
          "Your password has been updated successfully. You can now login with your new password.",
        confirmButtonText:
          "Go to Login",
      });


      router.push("/login");

    } catch (error) {
      console.error(
        "Reset password error:",
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


  /*
   * If there is no token, don't show the password
   * form because there is nothing to reset.
   */
  if (!token) {
    return (
      <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-muted/30 px-4 py-10">
        <Card className="w-full max-w-md">

          <CardHeader className="space-y-2 text-center">

            <CardTitle className="text-2xl font-bold">
              Invalid Reset Link
            </CardTitle>

            <CardDescription>
              This password reset link is invalid
              or missing.
            </CardDescription>

          </CardHeader>


          <CardContent>

            <div className="space-y-4">

              <Button
                type="button"
                className="w-full"
                size="lg"
                onClick={() =>
                  router.push(
                    "/forgot-password"
                  )
                }
              >
                Request New Reset Link
              </Button>


              <Link
                href="/login"
                className="flex items-center justify-center text-sm font-medium underline underline-offset-4"
              >
                Back to Login
              </Link>

            </div>

          </CardContent>

        </Card>
      </main>
    );
  }


  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-muted/30 px-4 py-10">

      <Card className="w-full max-w-md">

        <CardHeader className="space-y-2 text-center">

          <CardTitle className="text-2xl font-bold">
            Reset Password
          </CardTitle>

          <CardDescription>
            Enter your new password below.
          </CardDescription>

        </CardHeader>


        <CardContent>

          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >

            {/* New Password */}

            <div className="space-y-2">

              <Label htmlFor="password">
                New Password
              </Label>


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
                  placeholder="Enter new password"
                  value={
                    formData.password
                  }
                  onChange={handleChange}
                  className="pl-9 pr-10"
                  required
                  disabled={loading}
                  autoComplete="new-password"
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


            {/* Confirm Password */}

            <div className="space-y-2">

              <Label htmlFor="confirmPassword">
                Confirm Password
              </Label>


              <div className="relative">

                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />


                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={
                    showConfirmPassword
                      ? "text"
                      : "password"
                  }
                  placeholder="Confirm new password"
                  value={
                    formData.confirmPassword
                  }
                  onChange={handleChange}
                  className="pl-9 pr-10"
                  required
                  disabled={loading}
                  autoComplete="new-password"
                />


                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword(
                      (previous) =>
                        !previous
                    )
                  }
                  className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                  aria-label={
                    showConfirmPassword
                      ? "Hide password"
                      : "Show password"
                  }
                  disabled={loading}
                >

                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}

                </button>

              </div>

            </div>


            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={loading}
            >
              {loading
                ? "Resetting Password..."
                : "Reset Password"}
            </Button>

          </form>


          <p className="mt-6 text-center text-sm text-muted-foreground">

            Remember your password?{" "}

            <Link
              href="/login"
              className="font-medium text-foreground underline underline-offset-4"
            >
              Login
            </Link>

          </p>

        </CardContent>

      </Card>

    </main>
  );
}


export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-muted/30">
          <p className="text-sm text-muted-foreground">
            Loading...
          </p>
        </main>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}