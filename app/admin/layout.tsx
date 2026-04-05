import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { AdminLayoutProvider } from "@/components/admin/AdminLayoutContext";
// Future: await requireAdmin() when auth is wired - redirect to /login if not admin

/**
 * Admin layout with sidebar navigation.
 * Future: Add auth guard via requireAdmin(), role-based access control.
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminLayoutProvider>
      <div className="flex min-h-screen">
        <AdminSidebar />
        <div className="flex-1 overflow-auto min-w-0">
          {children}
        </div>
      </div>
    </AdminLayoutProvider>
  );
}
