import Link from "next/link";

/**
 * Account section layout with sub-navigation.
 * Future: Add auth guard, user context.
 */
export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="container mx-auto px-4 py-8">
      <nav className="mb-8 border-b border-ink/10 pb-4" aria-label="Account navigation">
        <ul className="flex gap-6">
          <li>
            <Link href="/account" className="text-ink hover:text-teal transition-colors">
              Overview
            </Link>
          </li>
          <li>
            <Link href="/account/orders" className="text-ink hover:text-teal transition-colors">
              Orders
            </Link>
          </li>
          {/* Future: Profile, addresses, wishlist */}
        </ul>
      </nav>
      {children}
    </div>
  );
}
