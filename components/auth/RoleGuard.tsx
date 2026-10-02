"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getStoredUser } from "@/services/auth";

export default function RoleGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const user = getStoredUser();

    // Not logged in
    if (!user) {
      setAllowed(true);
      setChecking(false);
      return;
    }

    // =========================
    // ADMIN
    // =========================

    if (user.role === "admin") {
      if (pathname.startsWith("/admin")) {
        setAllowed(true);
        setChecking(false);
        return;
      }

      setChecking(false);
      setAllowed(false);

      router.replace("/admin/dashboard");
      return;
    }

    // =========================
    // SELLER
    // =========================

    if (user.role === "seller") {
      if (pathname.startsWith("/seller")) {
        setAllowed(true);
        setChecking(false);
        return;
      }

      setChecking(false);
      setAllowed(false);

      router.replace("/seller/dashboard");
      return;
    }

    // =========================
    // CUSTOMER
    // =========================

    if (user.role === "customer") {
      if (
        pathname.startsWith("/seller") ||
        pathname.startsWith("/admin")
      ) {
        setChecking(false);
        setAllowed(false);

        router.replace("/");
        return;
      }

      setAllowed(true);
      setChecking(false);
      return;
    }

    setAllowed(true);
    setChecking(false);
  }, [pathname, router]);

  if (checking) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <p className="text-gray-500">
          Loading...
        </p>
      </div>
    );
  }

  if (!allowed) {
    return null;
  }

  return <>{children}</>;
}