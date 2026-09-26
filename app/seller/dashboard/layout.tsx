import type { ReactNode } from "react";

interface SellerDashboardLayoutProps {
  children: ReactNode;
}

export default function SellerDashboardLayout({
  children,
}: SellerDashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  );
}