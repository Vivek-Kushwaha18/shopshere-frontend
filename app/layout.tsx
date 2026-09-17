import type { Metadata } from "next";

import Header from "@/components/header/Header";
import Footer from "@/components/Footer/Footer";

import "./globals.css";

export const metadata: Metadata = {
  title: "ShopSphere",
  description: "Smart Shopping",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}