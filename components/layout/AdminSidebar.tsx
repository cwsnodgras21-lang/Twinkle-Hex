"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAdminLayout } from "@/components/admin/AdminLayoutContext";

type NavItem = {
  href: string;
  label: string;
  /** When set, controls active state (e.g. avoid highlighting Releases on polish recipe URLs). */
  isActive?: (pathname: string) => boolean;
};

function defaultNavActive(href: string, pathname: string): boolean {
  if (pathname === href) return true;
  if (href === "/admin") return pathname === "/admin";
  return pathname.startsWith(`${href}/`);
}

/** Release list/detail only — not /admin/releases/:id/polishes/... */
function isReleasesNavActive(pathname: string): boolean {
  if (pathname === "/admin/releases") return true;
  if (!pathname.startsWith("/admin/releases/")) return false;
  return !pathname.includes("/polishes/");
}

/** Polishes index + any polish/recipe page under a release */
function isPolishesNavActive(pathname: string): boolean {
  if (pathname === "/admin/polishes") return true;
  if (pathname.startsWith("/admin/polishes/")) return true;
  return /\/admin\/releases\/[^/]+\/polishes(\/|$)/.test(pathname);
}

/**
 * Admin sidebar with grouped navigation.
 * Future: requireAdmin() guard, collapse sections on mobile.
 */
const adminNavGroups: { label: string; items: NavItem[] }[] = [
  {
    label: "Overview",
    items: [{ href: "/admin", label: "Dashboard" }],
  },
  {
    label: "Shopify",
    items: [
      { href: "/admin/orders", label: "Orders" },
      { href: "/admin/customers", label: "Customers" },
      { href: "/admin/products", label: "Products" },
    ],
  },
  {
    label: "Inventory",
    items: [
      { href: "/admin/inventory", label: "Finished Goods" },
      { href: "/admin/ingredients", label: "Ingredients" },
      { href: "/admin/supplies", label: "Supplies" },
    ],
  },
  {
    label: "Production",
    items: [
      { href: "/admin/batches", label: "Batches" },
      { href: "/admin/releases", label: "Releases", isActive: isReleasesNavActive },
      { href: "/admin/polishes", label: "Polishes", isActive: isPolishesNavActive },
      { href: "/admin/swatchers", label: "Swatchers" },
    ],
  },
  {
    label: "Marketing & Sales",
    items: [
      { href: "/admin/social", label: "Social" },
      { href: "/admin/retail-partners", label: "Retail Partners" },
      { href: "/admin/events", label: "Events" },
      { href: "/admin/charity", label: "Charity" },
    ],
  },
  {
    label: "Community",
    items: [
      { href: "/admin/community", label: "Overview" },
      { href: "/admin/community/reports", label: "Reports" },
      { href: "/admin/community/channels", label: "Channels" },
      { href: "/admin/community/moderation", label: "Moderation" },
    ],
  },
  {
    label: "Settings",
    items: [{ href: "/admin/settings", label: "Settings" }],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { sidebarOpen, setSidebarOpen } = useAdminLayout();

  const navContent = (
    <nav aria-label="Admin navigation">
      {adminNavGroups.map((group) => (
        <div key={group.label} className="mb-4">
          <p className="px-4 mb-2 text-xs font-medium text-white/50 uppercase tracking-wider">
            {group.label}
          </p>
          <ul className="space-y-1">
            {group.items.map((item) => {
              const isActive = item.isActive
                ? item.isActive(pathname)
                : defaultNavActive(item.href, pathname);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`block px-4 py-2 rounded-lg transition-colors ${
                      isActive
                        ? "bg-teal text-white"
                        : "text-white/80 hover:bg-ink/80 hover:text-white"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
      <div className="mt-8 px-6">
        <Link
          href="/"
          className="text-sm text-white/60 hover:text-cyan transition-colors"
        >
          ← Back to Store
        </Link>
      </div>
    </nav>
  );

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-ink/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`
          w-64 min-h-screen bg-ink text-white flex-shrink-0
          fixed md:static inset-y-0 left-0 z-50
          transform transition-transform duration-200 ease-out
          md:transform-none
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        <div className="sticky top-0 py-6 overflow-y-auto h-full">
          <Link href="/admin" className="block px-6 mb-6">
            <span className="font-bold text-lg">Twinkle & Hex</span>
            <span className="block text-sm text-white/60">Admin</span>
          </Link>
          {navContent}
        </div>
      </aside>
    </>
  );
}
