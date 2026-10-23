
"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";
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

// =====================================================
// API ERROR HANDLING
// =====================================================

function getErrorMessage(
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

  let detail: unknown;

  if (
    result.data &&
    typeof result.data === "object"
  ) {
    const data = result.data as {
      detail?: unknown;
      message?: unknown;
    };

    detail =
      typeof data.detail === "string" ||
      Array.isArray(data.detail)
        ? data.detail
        : data.message;
  }

  if (
    typeof detail === "string" &&
    detail.trim()
  ) {
    return detail;
  }

  if (Array.isArray(detail)) {
    const messages = detail
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
    typeof result.message === "string" &&
    result.message.trim()
  ) {
    return result.message;
  }

  return fallback;
}

// =====================================================
// FORGOT PASSWORD PAGE
// =====================================================

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (loading) {
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setError("Please enter your email address.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      // forgotPassword expects the email string.
      const response = await forgotPassword(
        normalizedEmail
      );

      if (!response.success) {
        setError(
          getErrorMessage(
            response,
            "Unable to process your request. Please try again."
          )
        );

        return;
      }

      setEmail(normalizedEmail);
      setSubmitted(true);
    } catch (error: unknown) {
      console.error("Forgot password error:", error);

      const message =
        error instanceof Error
          ? error.message
          : "Unable to connect to the server. Please try again.";

      await Swal.fire({
        icon: "error",
        title: "Password Reset Request Failed",
        text: message,
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
            Enter your email address and we&apos;ll send you
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
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleTryAnotherEmail}
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
                        setEmail(event.target.value)
                      }
                      className="pl-9"
                      autoComplete="email"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                {error && (
                  <p
                    role="alert"
                    className="text-sm text-destructive"
                  >
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
