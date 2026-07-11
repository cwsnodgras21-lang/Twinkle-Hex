"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAdminLayout } from "./AdminLayoutContext";
import { useAuth } from "@/hooks/useAuth";

/**
 * Admin top bar - mobile menu trigger, breadcrumbs, actions.
 * Future: Breadcrumbs, search, notifications.
 */
export function AdminTopbar() {
  const { setSidebarOpen } = useAdminLayout();
  const { user, signOut } = useAuth();
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-ink/10">
      <div className="flex items-center justify-between h-14 px-4 md:px-6">
        {/* Mobile menu toggle - controls sidebar visibility on small screens */}
        <button
          type="button"
          className="md:hidden p-2 -ml-2 text-ink"
          onClick={() => setSidebarOpen(true)}
          aria-label="Toggle admin menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Future: Breadcrumbs, page title */}
        <div className="flex-1 min-w-0" />

        {/* Future: Search, notifications */}
        <div className="flex items-center gap-4">
          {user?.email && (
            <span className="hidden sm:inline text-sm text-ink/60">{user.email}</span>
          )}
          <Link
            href="/"
            className="text-sm text-ink/70 hover:text-teal transition-colors"
          >
            View Store
          </Link>
          <button
            type="button"
            onClick={handleSignOut}
            className="text-sm text-ink/70 hover:text-teal transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    </header>
  );
}
