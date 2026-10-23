
import type { Metadata } from "next";
import "./globals.css";

import GoogleAuthProvider from "@/components/auth/GoogleAuthProvider";
import ConditionalHeader from "@/components/layout/ConditionalHeader";
import RoleGuard from "@/components/auth/RoleGuard";
import ChatWidget from "@/components/ai-chat/ChatWidget";

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
        <GoogleAuthProvider>
          <ConditionalHeader />

          <main>
            <RoleGuard>{children}</RoleGuard>
          </main>

          <ChatWidget />
        </GoogleAuthProvider>
      </body>
    </html>
  );
}
