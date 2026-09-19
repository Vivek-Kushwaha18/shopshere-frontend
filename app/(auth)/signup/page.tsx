"use client";

import {
  signup,
  sendVerificationCode,
  verifyEmail,
} from "@/services/auth";

import Swal from "sweetalert2";
import Link from "next/link";
import {
  FormEvent,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import {
  Eye,
  EyeOff,
  Mail,
  User,
  Lock,
  Phone,
} from "lucide-react";

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

export default function SignupPage() {
  const router = useRouter();

  // ==========================================================
  // PASSWORD VISIBILITY
  // ==========================================================

  const [showPassword, setShowPassword] =
    useState(false);

  const [
    showConfirmPassword,
    setShowConfirmPassword,
  ] = useState(false);

  // ==========================================================
  // LOADING
  // ==========================================================

  const [loading, setLoading] =
    useState(false);

  const [resending, setResending] =
    useState(false);

  // ==========================================================
  // OTP MODE
  // ==========================================================

  const [otpMode, setOtpMode] =
    useState(false);

  const [otp, setOtp] =
    useState("");

  // ==========================================================
  // FORM DATA
  // ==========================================================

  const [formData, setFormData] =
    useState({
      fullName: "",
      email: "",
      phone: "",
      role: "customer",
      password: "",
      confirmPassword: "",
    });

  // ==========================================================
  // SIGNUP
  // ==========================================================

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (loading) {
      return;
    }

    const fullName =
      formData.fullName.trim();

    const email =
      formData.email
        .trim()
        .toLowerCase();

    const phone =
      formData.phone.trim();

    // ========================================================
    // VALIDATE NAME
    // ========================================================

    if (fullName.length < 2) {
      Swal.fire({
        icon: "error",
        title: "Invalid name",
        text:
          "Full name must be at least 2 characters.",
        confirmButtonText: "OK",
      });

      return;
    }

    // ========================================================
    // VALIDATE EMAIL
    // ========================================================

    if (!email) {
      Swal.fire({
        icon: "error",
        title: "Email required",
        text:
          "Please enter your email address.",
        confirmButtonText: "OK",
      });

      return;
    }

    // ========================================================
    // VALIDATE PASSWORD
    // ========================================================

    if (formData.password.length < 8) {
      Swal.fire({
        icon: "error",
        title: "Invalid password",
        text:
          "Password must be at least 8 characters.",
        confirmButtonText: "OK",
      });

      return;
    }

    // ========================================================
    // CONFIRM PASSWORD
    // ========================================================

    if (
      formData.password !==
      formData.confirmPassword
    ) {
      Swal.fire({
        icon: "error",
        title: "Passwords do not match",
        text:
          "Please make sure both passwords are the same.",
        confirmButtonText: "OK",
      });

      return;
    }

    setLoading(true);

    try {
      // ======================================================
      // CREATE ACCOUNT
      // ======================================================

      const response = await signup({
        full_name: fullName,
        email,
        phone: phone || undefined,
        password: formData.password,
        role:
          formData.role as
            | "customer"
            | "seller",
      });

      // ======================================================
      // SIGNUP FAILED
      // ======================================================

      if (!response.success) {
        Swal.fire({
          icon: "error",
          title: "Signup failed",
          text:
            response.data?.detail ||
            "Unable to create your account.",
          confirmButtonText: "OK",
        });

        return;
      }

      // ======================================================
      // SAVE EMAIL FOR VERIFICATION
      // ======================================================

      sessionStorage.setItem(
        "verification_email",
        email
      );

      // ======================================================
      // SHOW OTP MODE
      // ======================================================

      setOtpMode(true);

      await Swal.fire({
        icon: "success",
        title: "Account created",
        text:
          `A verification code has been sent to ${email}. Enter the code below to verify your email.`,
        confirmButtonText: "Enter Code",
      });
    } catch (error) {
      console.error(
        "Signup error:",
        error
      );

      Swal.fire({
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

  // ==========================================================
  // VERIFY OTP
  // ==========================================================

  async function handleVerifyOTP(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (loading) {
      return;
    }

    const email =
      formData.email
        .trim()
        .toLowerCase();

    const normalizedCode =
      otp.trim();

    // ========================================================
    // EMAIL VALIDATION
    // ========================================================

    if (!email) {
      Swal.fire({
        icon: "error",
        title: "Email missing",
        text:
          "Verification email is missing.",
        confirmButtonText: "OK",
      });

      return;
    }

    // ========================================================
    // OTP VALIDATION
    // ========================================================

    if (!normalizedCode) {
      Swal.fire({
        icon: "error",
        title: "OTP required",
        text:
          "Please enter the verification code.",
        confirmButtonText: "OK",
      });

      return;
    }

    if (
      !/^\d{6}$/.test(
        normalizedCode
      )
    ) {
      Swal.fire({
        icon: "error",
        title: "Invalid OTP",
        text:
          "Please enter the 6-digit verification code.",
        confirmButtonText:
          "Try Again",
      });

      return;
    }

    setLoading(true);

    try {
      // ======================================================
      // VERIFY EMAIL
      // ======================================================

      const response =
        await verifyEmail({
          email,
          code: normalizedCode,
        });

      // ======================================================
      // VERIFICATION FAILED
      // ======================================================

      if (!response.success) {
        Swal.fire({
          icon: "error",
          title: "Invalid OTP",
          text:
            response.data?.detail ||
            "The verification code is incorrect or expired. Please try again.",
          confirmButtonText:
            "Try Again",
        });

        return;
      }

      // ======================================================
      // REMOVE OLD AUTH DATA
      //
      // IMPORTANT:
      // User is verified, but NOT logged in yet.
      //
      // Therefore:
      // - No access token
      // - No refresh token
      // - No stored user
      // - No isLoggedIn
      // ======================================================

      localStorage.removeItem(
        "access_token"
      );

      localStorage.removeItem(
        "refresh_token"
      );

      localStorage.removeItem(
        "isLoggedIn"
      );

      localStorage.removeItem(
        "user"
      );

      // ======================================================
      // REMOVE VERIFICATION EMAIL
      // ======================================================

      sessionStorage.removeItem(
        "verification_email"
      );

      // ======================================================
      // NOTIFY HEADER
      // ======================================================

      window.dispatchEvent(
        new Event("auth-change")
      );

      // ======================================================
      // SUCCESS MESSAGE
      // ======================================================

      await Swal.fire({
        icon: "success",
        title: "Email verified!",
        text:
          "Your account has been verified successfully. Please login to continue.",
        confirmButtonText:
          "Go to Login",
      });

      // ======================================================
      // GO TO LOGIN PAGE
      // ======================================================

      router.push("/login");
    } catch (error) {
      console.error(
        "OTP verification error:",
        error
      );

      Swal.fire({
        icon: "error",
        title: "Connection Error",
        text:
          "Unable to verify your email. Please try again.",
        confirmButtonText: "OK",
      });
    } finally {
      setLoading(false);
    }
  }

  // ==========================================================
  // RESEND OTP
  // ==========================================================

  async function handleResendOTP() {
    if (
      resending ||
      loading
    ) {
      return;
    }

    const email =
      formData.email
        .trim()
        .toLowerCase();

    if (!email) {
      Swal.fire({
        icon: "error",
        title: "Email missing",
        text:
          "Please enter your email address.",
        confirmButtonText: "OK",
      });

      return;
    }

    setResending(true);

    try {
      const response =
        await sendVerificationCode(
          email
        );

      if (!response.success) {
        Swal.fire({
          icon: "error",
          title: "Unable to resend OTP",
          text:
            response.data?.detail ||
            "Unable to send a new verification code.",
          confirmButtonText: "OK",
        });

        return;
      }

      setOtp("");

      await Swal.fire({
        icon: "success",
        title: "New OTP sent",
        text:
          `A new verification code has been sent to ${email}.`,
        confirmButtonText: "OK",
      });
    } catch (error) {
      console.error(
        "Resend OTP error:",
        error
      );

      Swal.fire({
        icon: "error",
        title: "Connection Error",
        text:
          "Unable to resend the verification code.",
        confirmButtonText: "OK",
      });
    } finally {
      setResending(false);
    }
  }

  // ==========================================================
  // FORM CHANGE
  // ==========================================================

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

  // ==========================================================
  // OTP SCREEN
  // ==========================================================

  if (otpMode) {
    return (
      <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-muted/30 px-4 py-10">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-2 text-center">
            <CardTitle className="text-2xl font-bold">
              Verify your email
            </CardTitle>

            <CardDescription>
              We sent a 6-digit verification code to
              <br />

              <span className="font-medium text-foreground">
                {formData.email
                  .trim()
                  .toLowerCase()}
              </span>
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form
              onSubmit={
                handleVerifyOTP
              }
              className="space-y-5"
            >
              <div className="space-y-2">
                <Label htmlFor="otp-email">
                  Email Address
                </Label>

                <Input
                  id="otp-email"
                  type="email"
                  value={formData.email}
                  onChange={(
                    event
                  ) =>
                    setFormData(
                      (
                        previous
                      ) => ({
                        ...previous,
                        email:
                          event
                            .target
                            .value,
                      })
                    )
                  }
                  disabled={
                    loading ||
                    resending
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="otp">
                  Verification Code
                </Label>

                <Input
                  id="otp"
                  name="otp"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={(
                    event
                  ) => {
                    const value =
                      event.target.value
                        .replace(
                          /\D/g,
                          ""
                        )
                        .slice(
                          0,
                          6
                        );

                    setOtp(value);
                  }}
                  maxLength={6}
                  className="text-center text-lg tracking-[0.4em]"
                  required
                  disabled={
                    loading ||
                    resending
                  }
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={
                  loading ||
                  resending
                }
              >
                {loading
                  ? "Verifying..."
                  : "Verify Email"}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={
                  handleResendOTP
                }
                disabled={
                  loading ||
                  resending
                }
              >
                {resending
                  ? "Sending..."
                  : "Resend Verification Code"}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Entered the wrong email?
              </p>

              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setOtpMode(false);
                  setOtp("");

                  sessionStorage.removeItem(
                    "verification_email"
                  );
                }}
                disabled={
                  loading ||
                  resending
                }
              >
                Use Another Email
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
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

  // ==========================================================
  // SIGNUP SCREEN
  // ==========================================================

  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-muted/30 px-4 py-10">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-2xl font-bold">
            Create your account
          </CardTitle>

          <CardDescription>
            Join ShopSphere and start shopping smarter.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >
            <div className="space-y-2">
              <Label htmlFor="fullName">
                Full Name
              </Label>

              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />

                <Input
                  id="fullName"
                  name="fullName"
                  type="text"
                  placeholder="Enter your full name"
                  value={
                    formData.fullName
                  }
                  onChange={
                    handleChange
                  }
                  className="pl-9"
                  required
                  disabled={
                    loading
                  }
                />
              </div>
            </div>

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
                  value={
                    formData.email
                  }
                  onChange={
                    handleChange
                  }
                  className="pl-9"
                  required
                  disabled={
                    loading
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">
                Phone Number
                <span className="ml-1 text-muted-foreground">
                  (Optional)
                </span>
              </Label>

              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />

                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="Enter your phone number"
                  value={
                    formData.phone
                  }
                  onChange={
                    handleChange
                  }
                  className="pl-9"
                  maxLength={20}
                  disabled={
                    loading
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">
                Role
              </Label>

              <select
                id="role"
                name="role"
                value={
                  formData.role
                }
                onChange={(
                  event
                ) =>
                  setFormData(
                    (
                      previous
                    ) => ({
                      ...previous,
                      role:
                        event
                          .target
                          .value,
                    })
                  )
                }
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                required
                disabled={
                  loading
                }
              >
                <option value="customer">
                  Customer
                </option>

                <option value="seller">
                  Seller
                </option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">
                Password
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
                  placeholder="Create a password"
                  value={
                    formData.password
                  }
                  onChange={
                    handleChange
                  }
                  className="pl-9 pr-10"
                  required
                  minLength={8}
                  maxLength={128}
                  disabled={
                    loading
                  }
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      (
                        previous
                      ) =>
                        !previous
                    )
                  }
                  className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                  disabled={
                    loading
                  }
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>

              <p className="text-xs text-muted-foreground">
                Password must be at least 8 characters.
              </p>
            </div>

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
                  placeholder="Confirm your password"
                  value={
                    formData.confirmPassword
                  }
                  onChange={
                    handleChange
                  }
                  className="pl-9 pr-10"
                  required
                  minLength={8}
                  maxLength={128}
                  disabled={
                    loading
                  }
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword(
                      (
                        previous
                      ) =>
                        !previous
                    )
                  }
                  className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                  aria-label={
                    showConfirmPassword
                      ? "Hide password"
                      : "Show password"
                  }
                  disabled={
                    loading
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Checkbox
                id="terms"
                required
                disabled={
                  loading
                }
              />

              <Label
                htmlFor="terms"
                className="text-sm font-normal leading-5"
              >
                I agree to the{" "}
                <Link
                  href="/terms"
                  className="font-medium underline underline-offset-4"
                >
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link
                  href="/privacy"
                  className="font-medium underline underline-offset-4"
                >
                  Privacy Policy
                </Link>
                .
              </Label>
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={
                loading
              }
            >
              {loading
                ? "Creating Account..."
                : "Create Account"}
            </Button>
          </form>

          <div className="my-6 flex items-center gap-4">
            <Separator className="flex-1" />

            <span className="text-xs text-muted-foreground">
              OR
            </span>

            <Separator className="flex-1" />
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={loading}
          >
            Continue with Google
          </Button>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
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