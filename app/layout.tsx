import type { Metadata } from "next";
import "./globals.css";

import ConditionalHeader from "@/components/layout/ConditionalHeader";
import RoleGuard from "@/components/auth/RoleGuard";

export const metadata: Metadata = {
  title: "ShopSphere",
  description: "AI-Powered Multi-Vendor E-Commerce Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background antialiased">
        <ConditionalHeader />

        <main>
          <RoleGuard>{children}</RoleGuard>
        </main>
      </body>
    </html>
  );
}