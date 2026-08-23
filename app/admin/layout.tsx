import { Space_Grotesk } from "next/font/google";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { AdminLayoutProvider } from "@/components/admin/AdminLayoutContext";
import { requireAdminOrRedirect } from "@/lib/auth/roles";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-space-grotesk",
});

/**
 * Admin layout with sidebar navigation.
 * Auth is enforced twice: middleware.ts redirects unauthenticated/non-admin
 * requests before they reach this layout, and requireAdminOrRedirect() below
 * re-checks at render time as defense in depth (e.g. cached pages, direct
 * server-action invocations).
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdminOrRedirect();

  return (
    <AdminLayoutProvider>
      <div className={`flex min-h-screen bg-dash-bg ${spaceGrotesk.variable}`}>
        <AdminSidebar />
        <div className="flex-1 overflow-auto min-w-0">
          {children}
        </div>
      </div>
    </AdminLayoutProvider>
  );
}
