"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { ArrowLeft, Mail } from "lucide-react";
import Swal from "sweetalert2";

import { forgotPassword } from "@/services/auth";

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

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (loading) {
      return;
    }

    const normalizedEmail = email
      .trim()
      .toLowerCase();

    if (!normalizedEmail) {
      setError(
        "Please enter your email address."
      );

      return;
    }

    setError("");
    setLoading(true);

    try {
      const response =
        await forgotPassword({
          email: normalizedEmail,
        });

      if (!response.success) {
        setError(
          response.data?.detail ||
            "Unable to process your request."
        );

        return;
      }

      // Store normalized email for the success message
      setEmail(normalizedEmail);

      setSubmitted(true);

    } catch (error) {
      console.error(
        "Forgot password error:",
        error
      );

      Swal.fire({
        icon: "error",
        title: "Connection Error",
        text: "Unable to connect to the server. Please try again.",
        confirmButtonText: "OK",
      });
    } finally {
      setLoading(false);
    }
  }

  function handleTryAnotherEmail() {
    setSubmitted(false);
    setError("");
    setEmail("");
  }

  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-muted/30 px-4 py-10">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-2xl font-bold">
            Forgot your password?
          </CardTitle>

          <CardDescription>
            Enter your email address and we'll send you
            instructions to reset your password.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {submitted ? (
            <div className="space-y-5 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border bg-muted">
                <Mail className="h-5 w-5" />
              </div>

              <div>
                <h2 className="font-semibold">
                  Check your email
                </h2>

                <p className="mt-2 text-sm text-muted-foreground">
                  If an account exists for{" "}
                  <span className="font-medium text-foreground">
                    {email}
                  </span>
                  , you will receive password reset
                  instructions.
                </p>
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={
                  handleTryAnotherEmail
                }
              >
                Try another email
              </Button>

              <Link
                href="/login"
                className="flex items-center justify-center gap-2 text-sm font-medium underline underline-offset-4"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Login
              </Link>
            </div>
          ) : (
            <>
              <form
                onSubmit={handleSubmit}
                className="space-y-5"
              >
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
                      value={email}
                      onChange={(event) =>
                        setEmail(
                          event.target.value
                        )
                      }
                      className="pl-9"
                      required
                    />
                  </div>
                </div>

                {error && (
                  <p className="text-sm text-destructive">
                    {error}
                  </p>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={loading}
                >
                  {loading
                    ? "Sending..."
                    : "Send Reset Instructions"}
                </Button>
              </form>

              <Link
                href="/login"
                className="mt-6 flex items-center justify-center gap-2 text-sm font-medium underline underline-offset-4"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Login
              </Link>
            </>
          )}
        </CardContent>
      </Card>
    </main>
  );
}