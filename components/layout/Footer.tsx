import Link from "next/link";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-ink text-white mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-bold text-lg mb-4">Twinkle & Hex</h3>
            <p className="text-white/80 text-sm">
              Handcrafted indie nail polish for the bold and creative.
            </p>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-4">Shop</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/shop" className="text-white/80 hover:text-cyan transition-colors">
                  All Products
                </Link>
              </li>
              {/* Future: Collections, New Arrivals, etc. */}
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-4">Connect</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/community" className="text-white/80 hover:text-cyan transition-colors">
                  Community
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-white/80 hover:text-cyan transition-colors">
                  About Us
                </Link>
              </li>
              {/* Future: Social links, newsletter signup */}
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-white/20 text-center text-sm text-white/60">
          © {currentYear} Twinkle & Hex. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
