
"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  GoogleLogin,
  type CredentialResponse,
} from "@react-oauth/google";
import Swal from "sweetalert2";
import {
  Eye,
  EyeOff,
  Mail,
  User,
  Lock,
  Phone,
  ShieldCheck,
  ArrowLeft,
} from "lucide-react";

import {
  signup,
  sendVerificationCode,
  verifyEmail,
  googleLogin,
  verifyGoogleOtp,
  resendGoogleOtp,
  saveAuthSession,
  getRedirectPath,
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

type SignupRole = "customer" | "seller";
type OtpMode = "email" | "google" | null;

type SignupApiResponse = {
  success?: boolean;
  status?: number;
  message?: string;
  detail?: string | { msg?: string }[];
  is_verified?: boolean;
  requires_otp?: boolean;
  user?: { is_verified?: boolean };
  data?: {
    success?: boolean;
    message?: string;
    detail?: string | { msg?: string }[];
    is_verified?: boolean;
    requires_otp?: boolean;
    user?: { is_verified?: boolean };
  };
};

function getResponseMessage(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    return value
      .map((item) =>
        item && typeof item === "object" && "msg" in item
          ? String(item.msg ?? "")
          : ""
      )
      .filter(Boolean)
      .join(" ");
  }

  return "";
}

function isAlreadyVerifiedError(error: unknown): boolean {
  const message =
    error instanceof Error ? error.message : String(error ?? "");

  const normalized = message.toLowerCase();

  return (
    normalized.includes("already") &&
    (
      normalized.includes("verified") ||
      normalized.includes("registered") ||
      normalized.includes("exists")
    )
  );
}

function isAlreadyVerifiedResponse(
  response: SignupApiResponse
): boolean {
  const data = response.data;

  const message = [
    response.message,
    getResponseMessage(response.detail),
    data?.message,
    getResponseMessage(data?.detail),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const explicitlyVerified =
    response.is_verified === true ||
    response.user?.is_verified === true ||
    data?.is_verified === true ||
    data?.user?.is_verified === true;

  const verifiedMessage =
    message.includes("already") &&
    (
      message.includes("verified") ||
      message.includes("registered") ||
      message.includes("exists")
    );

  return explicitlyVerified || verifiedMessage;
}

function SignupForm() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [otpMode, setOtpMode] = useState<OtpMode>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<SignupRole>("customer");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");

  const normalizedEmail = email.trim().toLowerCase();
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  const getVerificationEmail = (): string => {
    if (typeof window === "undefined") {
      return normalizedEmail;
    }

    return (
      sessionStorage.getItem("verification_email") ||
      normalizedEmail
    )
      .trim()
      .toLowerCase();
  };

  const clearVerificationState = () => {
    sessionStorage.removeItem("verification_email");
    sessionStorage.removeItem("verification_method");
    setOtp("");
    setOtpMode(null);
  };

  const showError = async (title: string, error: unknown) => {
    const message =
      error instanceof Error
        ? error.message
        : "Something went wrong. Please try again.";

    await Swal.fire(title, message, "error");
  };

  const handleAlreadyVerified = async () => {
    clearVerificationState();

    await Swal.fire({
      title: "Already verified",
      text: "Your account is already verified. Please log in.",
      icon: "info",
      confirmButtonText: "Go to login",
    });

    router.replace("/login");
  };

  // EMAIL/PASSWORD SIGNUP

  const handleSignup = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (password !== confirmPassword) {
      await Swal.fire(
        "Password mismatch",
        "Your passwords do not match.",
        "error"
      );
      return;
    }

    if (password.length < 8) {
      await Swal.fire(
        "Invalid password",
        "Your password must contain at least 8 characters.",
        "warning"
      );
      return;
    }

    setLoading(true);

    try {
      const response = (await signup({
        full_name: fullName.trim(),
        email: normalizedEmail,
        phone: phone.trim() || undefined,
        password,
        role,
      })) as SignupApiResponse;

      if (isAlreadyVerifiedResponse(response)) {
        await handleAlreadyVerified();
        return;
      }

      sessionStorage.setItem("verification_email", normalizedEmail);
      sessionStorage.setItem("verification_method", "email");

      setEmail(normalizedEmail);
      setOtp("");
      setOtpMode("email");

      await Swal.fire(
        "Verification code sent",
        "Check your email for the six-digit verification code.",
        "success"
      );
    } catch (error) {
      if (isAlreadyVerifiedError(error)) {
        await handleAlreadyVerified();
        return;
      }

      await showError("Signup failed", error);
    } finally {
      setLoading(false);
    }
  };

  // EMAIL OTP VERIFICATION

  const handleVerifyEmail = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!/^\d{6}$/.test(otp.trim())) {
      await Swal.fire(
        "Invalid code",
        "Enter the six-digit verification code from your email.",
        "warning"
      );
      return;
    }

    const verificationEmail = getVerificationEmail();

    if (!verificationEmail) {
      await Swal.fire(
        "Email required",
        "Please enter the email address used to create your account.",
        "warning"
      );
      return;
    }

    setLoading(true);

    try {
      await verifyEmail({
        email: verificationEmail,
        code: otp.trim(),
      });

      clearVerificationState();

      await Swal.fire(
        "Email verified",
        "Your account is verified. You can now log in.",
        "success"
      );

      router.replace("/login");
    } catch (error) {
      await showError("Verification failed", error);
    } finally {
      setLoading(false);
    }
  };

  // RESEND EMAIL OTP

  const handleResendEmailCode = async () => {
    const verificationEmail = getVerificationEmail();

    if (!verificationEmail) {
      await Swal.fire(
        "Email required",
        "Please provide the email address used to create your account.",
        "warning"
      );
      return;
    }

    setLoading(true);

    try {
      await sendVerificationCode(verificationEmail);

      await Swal.fire(
        "Code sent",
        "Check your email for the new verification code.",
        "success"
      );
    } catch (error) {
      if (isAlreadyVerifiedError(error)) {
        await handleAlreadyVerified();
        return;
      }

      await showError("Unable to resend code", error);
    } finally {
      setLoading(false);
    }
  };

  // GOOGLE SIGNUP / LOGIN

  const handleGoogleSuccess = async (
    credentialResponse: CredentialResponse
  ) => {
    if (!credentialResponse.credential) {
      await Swal.fire(
        "Google authentication failed",
        "Google did not return a valid credential. Please try again.",
        "error"
      );
      return;
    }

    setLoading(true);

    try {
      const response = await googleLogin(
        credentialResponse.credential
      );

      if (response.requires_otp) {
        if (!response.email) {
          throw new Error(
            "The server requested OTP verification but did not return the email address."
          );
        }

        const googleEmail = response.email.trim().toLowerCase();

        sessionStorage.setItem("verification_email", googleEmail);
        sessionStorage.setItem("verification_method", "google");

        setEmail(googleEmail);
        setOtp("");
        setOtpMode("google");

        await Swal.fire(
          "Verify your Google email",
          response.message ||
            `A verification code has been sent to ${googleEmail}. Enter the code to complete signup.`,
          "success"
        );

        return;
      }

      if (!response.access_token || !response.user) {
        throw new Error(
          response.message ||
            "The server returned an invalid Google authentication response."
        );
      }

      saveAuthSession({
        access_token: response.access_token,
        refresh_token: response.refresh_token,
        token_type: response.token_type,
        user: response.user,
        message: response.message,
      });

      clearVerificationState();

      await Swal.fire(
        "Welcome to ShopSphere",
        "You have signed in successfully with Google.",
        "success"
      );

      router.replace(getRedirectPath(response.user.role));
    } catch (error) {
      await showError("Google authentication failed", error);
    } finally {
      setLoading(false);
    }
  };

  // GOOGLE OTP VERIFICATION

  const handleVerifyGoogleOtp = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!/^\d{6}$/.test(otp.trim())) {
      await Swal.fire(
        "Invalid code",
        "Enter the six-digit verification code from your email.",
        "warning"
      );
      return;
    }

    const verificationEmail = getVerificationEmail();

    if (!verificationEmail) {
      await Swal.fire(
        "Email required",
        "The Google signup email could not be found. Please try Google signup again.",
        "warning"
      );
      return;
    }

    setLoading(true);

    try {
      const response = await verifyGoogleOtp({
        email: verificationEmail,
        code: otp.trim(),
      });

      if (!response.access_token || !response.user) {
        throw new Error(
          "Email verification succeeded, but the server did not return a valid authentication session."
        );
      }

      saveAuthSession(response);
      clearVerificationState();

      await Swal.fire(
        "Google signup completed",
        "Your email has been verified and your ShopSphere account is ready.",
        "success"
      );

      router.replace(getRedirectPath(response.user.role));
    } catch (error) {
      await showError("Google verification failed", error);
    } finally {
      setLoading(false);
    }
  };

  // RESEND GOOGLE OTP

  const handleResendGoogleOtp = async () => {
    const verificationEmail = getVerificationEmail();

    if (!verificationEmail) {
      await Swal.fire(
        "Email required",
        "The Google signup email could not be found. Please try Google signup again.",
        "warning"
      );
      return;
    }

    setLoading(true);

    try {
      const response = await resendGoogleOtp({
        email: verificationEmail,
      });

      if (response.requires_otp === false && response.access_token) {
        await handleAlreadyVerified();
        return;
      }

      await Swal.fire(
        "Verification code sent",
        response.message ||
          `A new verification code has been requested for ${verificationEmail}.`,
        "success"
      );
    } catch (error) {
      if (isAlreadyVerifiedError(error)) {
        await handleAlreadyVerified();
        return;
      }

      await showError("Unable to resend Google OTP", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    void Swal.fire(
      "Google authentication failed",
      "Google authentication could not be completed. Please try again.",
      "error"
    );
  };

  // UI

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-10 dark:bg-gray-950">
      <Card className="w-full max-w-lg">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-2xl font-bold">
            {otpMode === "google"
              ? "Verify Google signup"
              : otpMode === "email"
                ? "Verify your email"
                : "Create your account"}
          </CardTitle>

          <CardDescription>
            {otpMode === "google"
              ? "Enter the verification code sent to your Google email address."
              : otpMode === "email"
                ? "Enter the verification code sent to your email."
                : "Join ShopSphere and start shopping or selling."}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {!otpMode && (
            <>
              <div className="flex items-center gap-4">
                <Separator className="flex-1" />
                <span className="text-xs text-muted-foreground">
                  SIGN UP WITH EMAIL
                </span>
                <Separator className="flex-1" />
              </div>

              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="fullName"
                      className="pl-9"
                      placeholder="Enter your full name"
                      value={fullName}
                      onChange={(event) => setFullName(event.target.value)}
                      minLength={2}
                      maxLength={100}
                      autoComplete="name"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      className="pl-9"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      autoComplete="email"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone number (optional)</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      className="pl-9"
                      placeholder="Enter your phone number"
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                      autoComplete="tel"
                      maxLength={20}
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Account type</Label>
                  <select
                    id="role"
                    value={role}
                    onChange={(event) =>
                      setRole(event.target.value as SignupRole)
                    }
                    disabled={loading}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="customer">Customer</option>
                    <option value="seller">Seller</option>
                  </select>

                  <p className="text-xs text-muted-foreground">
                    Admin accounts cannot be created through signup.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      className="pl-9 pr-10"
                      placeholder="At least 8 characters"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      minLength={8}
                      maxLength={128}
                      autoComplete="new-password"
                      required
                      disabled={loading}
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      className="absolute right-3 top-2.5 text-muted-foreground"
                      aria-label={showPassword ? "Hide password" : "Show password"}
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

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      className="pl-9 pr-10"
                      placeholder="Enter your password again"
                      value={confirmPassword}
                      onChange={(event) =>
                        setConfirmPassword(event.target.value)
                      }
                      minLength={8}
                      maxLength={128}
                      autoComplete="new-password"
                      required
                      disabled={loading}
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword((current) => !current)
                      }
                      className="absolute right-3 top-2.5 text-muted-foreground"
                      aria-label={
                        showConfirmPassword
                          ? "Hide confirm password"
                          : "Show confirm password"
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

                <p className="text-sm text-muted-foreground">
                  By creating an account, you acknowledge our{" "}
                  <Link
                    href="/terms"
                    className="font-medium text-primary underline underline-offset-4"
                  >
                    Terms and Conditions
                  </Link>{" "}
                  and{" "}
                  <Link
                    href="/privacy"
                    className="font-medium text-primary underline underline-offset-4"
                  >
                    Privacy Policy
                  </Link>
                  .
                </p>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Creating account..." : "Create account"}
                </Button>
              </form>

              <div className="flex items-center gap-4">
                <Separator className="flex-1" />
                <span className="text-xs text-muted-foreground">OR</span>
                <Separator className="flex-1" />
              </div>

              {googleClientId ? (
                <div className="flex justify-center">
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                    theme="outline"
                    size="large"
                    text="continue_with"
                    shape="rectangular"
                    width="320"
                    useOneTap={false}
                  />
                </div>
              ) : (
                <p className="text-center text-sm text-red-600">
                  Google login is not configured. Set
                  NEXT_PUBLIC_GOOGLE_CLIENT_ID in .env.local and restart the frontend.
                </p>
              )}
            </>
          )}

          {otpMode !== null && (
            <form
              onSubmit={
                otpMode === "google"
                  ? handleVerifyGoogleOtp
                  : handleVerifyEmail
              }
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
                  {getVerificationEmail() || normalizedEmail}
                </span>
              </div>

              <div className="space-y-2">
                <Label htmlFor="otp">Six-digit verification code</Label>
                <Input
                  id="otp"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="000000"
                  value={otp}
                  onChange={(event) =>
                    setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  maxLength={6}
                  pattern="[0-9]{6}"
                  required
                  disabled={loading}
                  className="text-center text-xl tracking-[0.5em]"
                />
                <p className="text-sm text-muted-foreground">
                  Enter the latest six-digit code sent to your email.
                </p>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loading || otp.length !== 6}
              >
                {loading
                  ? "Verifying..."
                  : otpMode === "google"
                    ? "Verify and complete signup"
                    : "Verify email"}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={
                  otpMode === "google"
                    ? handleResendGoogleOtp
                    : handleResendEmailCode
                }
                disabled={loading}
              >
                Resend verification code
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setOtpMode(null);
                  setOtp("");

                  if (otpMode === "google") {
                    sessionStorage.removeItem("verification_email");
                    sessionStorage.removeItem("verification_method");
                  }
                }}
                disabled={loading}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to signup
              </Button>
            </form>
          )}

          {!otpMode && (
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-medium text-primary hover:underline"
              >
                Log in
              </Link>
            </p>
          )}
        </CardContent>
      </Card>
    </main>
  );
}

export default function SignupPage() {
  return <SignupForm />;
}
