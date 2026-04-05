"use client";

import Link from "next/link";
import { useState } from "react";
import { MobileNav } from "./MobileNav";

export function Header() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-ink/10">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-18">
          <Link href="/" className="text-xl font-bold text-ink hover:text-teal transition-colors">
            Twinkle & Hex
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8" aria-label="Main navigation">
            <Link href="/shop" className="text-ink hover:text-teal transition-colors">
              Shop
            </Link>
            <Link href="/about" className="text-ink hover:text-teal transition-colors">
              About
            </Link>
            <Link href="/community" className="text-ink hover:text-teal transition-colors">
              Community
            </Link>
            <Link href="/account" className="text-ink hover:text-teal transition-colors">
              Account
            </Link>
          </nav>

          {/* Mobile menu button */}
          <button
            type="button"
            className="md:hidden p-2 text-ink"
            onClick={() => setMobileNavOpen(true)}
            aria-label="Open menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      <MobileNav open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
    </header>
  );
}
