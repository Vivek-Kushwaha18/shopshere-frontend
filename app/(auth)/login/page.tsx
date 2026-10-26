
"use client";

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import { Eye, EyeOff, Mail, Lock, ShieldCheck, ArrowLeft } from "lucide-react";

import {
  login,
  googleLogin,
  verifyGoogleOtp,
  resendGoogleOtp,
  saveAuthSession,
  getRedirectPath,
  getStoredUser,
  type AuthUser,
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
import { Separator } from "@/components/ui/separator";

type AuthPayload = {
  access_token?: string;
  refresh_token?: string;
  user?: AuthUser;
  detail?: string | { msg?: string }[];
  message?: string;
  data?: AuthPayload;
};

type GoogleOtpMode = "google" | null;

function getErrorMessage(data: AuthPayload): string | undefined {
  if (typeof data.detail === "string") {
    return data.detail;
  }

  if (Array.isArray(data.detail)) {
    return data.detail
      .map((item) => item.msg)
      .filter(Boolean)
      .join(", ");
  }

  return data.message;
}

export default function LoginPage() {
  const router = useRouter();
  const authRequestInProgress = useRef(false);

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleOtpMode, setGoogleOtpMode] = useState<GoogleOtpMode>(null);
  const [googleOtp, setGoogleOtp] = useState("");
  const [googleOtpEmail, setGoogleOtpEmail] = useState("");

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  useEffect(() => {
    function handleStorageChange(event: StorageEvent) {
      if (event.key !== "access_token") {
        return;
      }

      const user = getStoredUser();
      if (user) {
        router.replace(getRedirectPath(user.role));
      }
    }

    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [router]);

  function clearVerificationData() {
    if (typeof window === "undefined") return;

    sessionStorage.removeItem("verification_email");
    sessionStorage.removeItem("verification_method");
    localStorage.removeItem("verification_email");
  }

  function redirectByRole(role: AuthUser["role"]) {
    router.replace(getRedirectPath(role));
  }

  async function showError(title: string, error: unknown) {
    await Swal.fire({
      icon: "error",
      title,
      text:
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again.",
      confirmButtonText: "OK",
    });
  }

  // =====================================================
  // EMAIL AND PASSWORD LOGIN
  // =====================================================

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (loading || authRequestInProgress.current) return;

    const email = formData.email.trim().toLowerCase();
    const password = formData.password;

    if (!email || !password) {
      await Swal.fire({
        icon: "warning",
        title: "Missing information",
        text: "Please enter your email address and password.",
        confirmButtonText: "OK",
      });
      return;
    }

    authRequestInProgress.current = true;
    setLoading(true);

    try {
      const response = await login({
        email,
        password,
      });

      if (!response.success) {
        const errorData = response.data as AuthPayload | undefined;

        await Swal.fire({
          icon: "error",
          title: "Login failed",
          text:
            (errorData && getErrorMessage(errorData)) ||
            "Invalid email or password.",
          confirmButtonText: "OK",
        });
        return;
      }

      const data = response.data;
      const accessToken = data?.access_token;
      const refreshToken = data?.refresh_token;
      const user = data?.user;

      if (
        !accessToken ||
        !user
      ) {
        throw new Error(
          "The server returned incomplete login information."
        );
      }

      if (!["customer", "seller", "admin"].includes(user.role)) {
        throw new Error("The server returned an invalid account role.");
      }

      saveAuthSession(
        {
          access_token: accessToken,
          refresh_token: refreshToken,
          user,
        }
      );

      clearVerificationData();

      await Swal.fire({
        icon: "success",
        title: "Login successful!",
        text: `Welcome back, ${user.full_name}.`,
        confirmButtonText: "Continue",
      });

      redirectByRole(user.role);
    } catch (error) {
      await showError("Login failed", error);
    } finally {
      authRequestInProgress.current = false;
      setLoading(false);
    }
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  // =====================================================
  // GOOGLE LOGIN
  // =====================================================

  async function handleGoogleSuccess(
    credentialResponse: CredentialResponse
  ) {
    if (loading || authRequestInProgress.current) return;

    const credential = credentialResponse.credential;

    if (!credential) {
      await Swal.fire({
        icon: "error",
        title: "Google login failed",
        text: "Google did not return a valid credential. Please try again.",
        confirmButtonText: "OK",
      });
      return;
    }

    authRequestInProgress.current = true;
    setLoading(true);

    try {
      const response = await googleLogin(credential);

      // A new Google account must verify its email before a session
      // can be created. Do not save tokens at this stage.
      if (response.requires_otp) {
        if (!response.email) {
          throw new Error(
            "The server requested OTP verification but did not return an email address."
          );
        }

        const email = response.email.trim().toLowerCase();

        setGoogleOtpEmail(email);
        setGoogleOtp("");
        setGoogleOtpMode("google");

        sessionStorage.setItem("verification_email", email);
        sessionStorage.setItem("verification_method", "google");

        await Swal.fire({
          icon: "success",
          title: "Verify your Google email",
          text:
            response.message ||
            `A verification code has been sent to ${email}. Enter the code to finish signup.`,
          confirmButtonText: "Continue",
        });

        return;
      }

      // Existing verified Google accounts can sign in directly.
      if (
        !response.access_token ||
        !response.user
      ) {
        throw new Error(
          response.message ||
            "The server returned incomplete Google authentication information."
        );
      }

      if (
        !["customer", "seller", "admin"].includes(
          response.user.role
        )
      ) {
        throw new Error("The server returned an invalid account role.");
      }

      saveAuthSession(
        {
          access_token: response.access_token,
          refresh_token: response.refresh_token,
          token_type: response.token_type,
          user: response.user,
          message: response.message,
        }
      );

      clearVerificationData();

      await Swal.fire({
        icon: "success",
        title: "Google login successful!",
        text: `Welcome back, ${response.user.full_name}.`,
        confirmButtonText: "Continue",
      });

      redirectByRole(response.user.role);
    } catch (error) {
      await showError("Google login failed", error);
    } finally {
      authRequestInProgress.current = false;
      setLoading(false);
    }
  }

  async function handleGoogleError() {
    await Swal.fire({
      icon: "error",
      title: "Google login failed",
      text: "Google authentication could not be completed. Please try again.",
      confirmButtonText: "OK",
    });
  }

  // =====================================================
  // GOOGLE OTP VERIFICATION
  // =====================================================

  async function handleVerifyGoogleOtp(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (loading || authRequestInProgress.current) return;

    if (!/^\d{6}$/.test(googleOtp)) {
      await Swal.fire({
        icon: "warning",
        title: "Invalid verification code",
        text: "Enter the six-digit code sent to your email.",
        confirmButtonText: "OK",
      });
      return;
    }

    const email =
      googleOtpEmail ||
      (typeof window !== "undefined"
        ? sessionStorage.getItem("verification_email") || ""
        : "");

    if (!email) {
      await Swal.fire({
        icon: "error",
        title: "Email not found",
        text: "Please restart Google signup to request a new verification code.",
        confirmButtonText: "OK",
      });
      return;
    }

    authRequestInProgress.current = true;
    setLoading(true);

    try {
      const response = await verifyGoogleOtp({
        email: email.trim().toLowerCase(),
        code: googleOtp,
      });

      if (
        !response.access_token ||
        !response.user
      ) {
        throw new Error(
          "The server did not return a valid session after OTP verification."
        );
      }

      // Create the session only after the backend verifies the OTP.
      saveAuthSession(response);

      clearVerificationData();

      await Swal.fire({
        icon: "success",
        title: "Account verified!",
        text: `Welcome to ShopSphere, ${response.user.full_name}.`,
        confirmButtonText: "Continue",
      });

      redirectByRole(response.user.role);
    } catch (error) {
      await showError("OTP verification failed", error);
    } finally {
      authRequestInProgress.current = false;
      setLoading(false);
    }
  }

  // =====================================================
  // RESEND GOOGLE OTP
  // =====================================================

  async function handleResendGoogleOtp() {
    if (loading || authRequestInProgress.current) return;

    const email =
      googleOtpEmail ||
      (typeof window !== "undefined"
        ? sessionStorage.getItem("verification_email") || ""
        : "");

    if (!email) {
      await Swal.fire({
        icon: "error",
        title: "Email not found",
        text: "Please restart Google signup to request a new code.",
        confirmButtonText: "OK",
      });
      return;
    }

    authRequestInProgress.current = true;
    setLoading(true);

    try {
      const response = await resendGoogleOtp({
        email: email.trim().toLowerCase(),
      });

      await Swal.fire({
        icon: "success",
        title: "Verification code requested",
        text:
          response.message ||
          `Check ${email} for your new verification code.`,
        confirmButtonText: "OK",
      });
    } catch (error) {
      await showError("Unable to resend verification code", error);
    } finally {
      authRequestInProgress.current = false;
      setLoading(false);
    }
  }

  function cancelGoogleOtp() {
    setGoogleOtpMode(null);
    setGoogleOtp("");
    setGoogleOtpEmail("");
    clearVerificationData();
  }

  // =====================================================
  // UI
  // =====================================================

  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-muted/30 px-4 py-10">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-2xl font-bold">
            {googleOtpMode ? "Verify your Google email" : "Welcome back"}
          </CardTitle>

          <CardDescription>
            {googleOtpMode
              ? "Enter the six-digit verification code to finish creating your account."
              : "Login to your ShopSphere account."}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {googleOtpMode ? (
            <form
              onSubmit={handleVerifyGoogleOtp}
              className="space-y-5"
            >
              <div className="flex justify-center">
                <div className="rounded-full bg-primary/10 p-4">
                  <ShieldCheck className="h-8 w-8 text-primary" />
                </div>
              </div>

              <div className="rounded-md bg-muted p-3 text-center text-sm">
                Verification email:{" "}
                <span className="font-medium">
                  {googleOtpEmail}
                </span>
              </div>

              <div className="space-y-2">
                <Label htmlFor="googleOtp">
                  Six-digit verification code
                </Label>

                <Input
                  id="googleOtp"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="000000"
                  value={googleOtp}
                  onChange={(event) =>
                    setGoogleOtp(
                      event.target.value
                        .replace(/\D/g, "")
                        .slice(0, 6)
                    )
                  }
                  maxLength={6}
                  pattern="[0-9]{6}"
                  required
                  disabled={loading}
                  className="text-center text-xl tracking-[0.5em]"
                />

                <p className="text-sm text-muted-foreground">
                  Check your inbox and spam folder for the verification
                  code.
                </p>
              </div>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={loading || googleOtp.length !== 6}
              >
                {loading ? "Verifying..." : "Verify and continue"}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleResendGoogleOtp}
                disabled={loading}
              >
                Resend verification code
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={cancelGoogleOtp}
                disabled={loading}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to login
              </Button>
            </form>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>

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

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>

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
                      type={showPassword ? "text" : "password"}
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
                        setShowPassword((previous) => !previous)
                      }
                      className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
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

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={loading}
                >
                  {loading ? "Logging in..." : "Login"}
                </Button>
              </form>

              <div className="my-6 flex items-center gap-4">
                <Separator className="flex-1" />
                <span className="text-xs text-muted-foreground">
                  OR
                </span>
                <Separator className="flex-1" />
              </div>

              <div
                className={`flex min-h-10 justify-center ${
                  loading ? "pointer-events-none opacity-60" : ""
                }`}
              >
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  useOneTap={false}
                  text="continue_with"
                  shape="rectangular"
                  size="large"
                  width="320"
                />
              </div>

              <p className="mt-6 text-center text-sm text-muted-foreground">
                Don&apos;t have an account?{" "}
                <Link
                  href="/signup"
                  className="font-medium text-foreground underline underline-offset-4"
                >
                  Sign Up
                </Link>
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
