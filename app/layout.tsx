
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import GoogleAuthProvider from "@/components/auth/GoogleAuthProvider";
import ConditionalHeader from "@/components/layout/ConditionalHeader";
import RoleGuard from "@/components/auth/RoleGuard";
import ChatWidget from "@/components/ai-chat/ChatWidget";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: {
    default: "ShopSphere | Smart Shopping",
    template: "%s | ShopSphere",
  },
  description:
    "Discover quality products, compare prices, and enjoy a smarter shopping experience with ShopSphere, an AI-powered multi-vendor marketplace.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body
        className={`${inter.className} min-h-screen bg-background antialiased`}
      >
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
