"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAdminLayout } from "@/components/admin/AdminLayoutContext";

type NavItem = {
  href: string;
  label: string;
  icon: string;
};

function isNavActive(href: string, pathname: string): boolean {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Minimal admin nav: the three questions this tool answers, plus Settings.
 */
const adminNavItems: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: "◆" },
  { href: "/admin/inventory", label: "Finished Stock", icon: "●" },
  { href: "/admin/ingredients", label: "Ingredients", icon: "◈" },
  { href: "/admin/polishes", label: "Polishes", icon: "◐" },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { sidebarOpen, setSidebarOpen } = useAdminLayout();

  const navContent = (
    <nav aria-label="Admin navigation">
      <ul className="space-y-1 px-3">
        {adminNavItems.map((item) => {
          const isActive = isNavActive(item.href, pathname);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  isActive
                    ? "bg-gradient-to-r from-teal to-plum text-white shadow-sm"
                    : "text-white/80 hover:bg-white/10 hover:text-white"
                }`}
              >
                <span className="text-cyan/90 w-4 text-center" aria-hidden="true">
                  {item.icon}
                </span>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="mt-6 px-6 pt-6 border-t border-white/10">
        <Link
          href="/admin/settings"
          className={`text-sm transition-colors ${
            isNavActive("/admin/settings", pathname) ? "text-cyan" : "text-white/60 hover:text-cyan"
          }`}
        >
          Settings
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
            <span className="font-bold text-lg bg-gradient-to-r from-cyan to-magenta bg-clip-text text-transparent">
              Twinkle &amp; Hex
            </span>
            <span className="block text-sm text-white/60">Ops</span>
          </Link>
          {navContent}
        </div>
      </aside>
    </>
  );
}
