"use client";

import Image from "next/image";
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
  { href: "/admin/releases", label: "Releases", icon: "▣" },
  { href: "/admin/polishes", label: "Polishes", icon: "◐" },
  { href: "/admin/ingredients", label: "Ingredients", icon: "◈" },
  { href: "/admin/rd", label: "R&D Lab", icon: "◇" },
  { href: "/admin/swatchers", label: "Swatchers", icon: "○" },
  { href: "/admin/calendar", label: "Calendar", icon: "▤" },
  { href: "/admin/inventory", label: "Finished Stock", icon: "●" },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { sidebarOpen, setSidebarOpen } = useAdminLayout();

  const navContent = (
    <nav aria-label="Admin navigation">
      <ul className="space-y-0.5 px-3">
        {adminNavItems.map((item) => {
          const isActive = isNavActive(item.href, pathname);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[13.5px] font-medium transition-colors ${
                  isActive ? "bg-dash-pinkNavActive text-white" : "text-dash-navyText hover:bg-dash-navyHover"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-[1px] shrink-0 ${isActive ? "bg-dash-pink" : "bg-dash-navyDot"}`}
                  aria-hidden="true"
                />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="mt-6 px-6 pt-6 border-t border-dash-navyBorder">
        <Link
          href="/admin/settings"
          className={`text-sm transition-colors ${
            isNavActive("/admin/settings", pathname) ? "text-dash-pink" : "text-dash-navyText hover:text-dash-pink"
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
          w-64 min-h-screen bg-dash-navy border-r border-dash-navyBorder text-white flex-shrink-0
          fixed md:static inset-y-0 left-0 z-50
          transform transition-transform duration-200 ease-out
          md:transform-none
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        <div className="sticky top-0 py-6 overflow-y-auto h-full">
          <Link href="/admin" className="block px-6 mb-6">
            <Image
              src="/logo.png"
              alt="Twinkle & Hex Polish"
              width={160}
              height={160}
              className="w-28 h-auto"
              priority
            />
            <span className="block text-sm text-dash-navyText mt-1">Ops</span>
          </Link>
          {navContent}
        </div>
      </aside>
    </>
  );
}
