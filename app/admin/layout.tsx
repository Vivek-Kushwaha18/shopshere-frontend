import AdminHeader from "@/components/layout/AdminHeader";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader />

      <main>{children}</main>
    </div>
  );
}