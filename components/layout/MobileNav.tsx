"use client";

import Link from "next/link";

interface MobileNavProps {
  open: boolean;
  onClose: () => void;
}

export function MobileNav({ open, onClose }: MobileNavProps) {
  if (!open) return null;

  const navLinks = [
    { href: "/shop", label: "Shop" },
    { href: "/about", label: "About" },
    { href: "/community", label: "Community" },
    { href: "/account", label: "Account" },
  ];

  return (
    <div
      className="md:hidden fixed inset-0 z-50 bg-ink/50"
      onClick={onClose}
      aria-hidden="true"
    >
      <nav
        className="absolute right-0 top-0 h-full w-64 bg-white shadow-lg"
        onClick={(e) => e.stopPropagation()}
        aria-label="Mobile navigation"
      >
        <div className="flex justify-between items-center p-4 border-b">
          <span className="font-bold text-ink">Menu</span>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-ink"
            aria-label="Close menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <ul className="p-4 space-y-2">
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                onClick={onClose}
                className="block py-2 text-ink hover:text-teal transition-colors"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
