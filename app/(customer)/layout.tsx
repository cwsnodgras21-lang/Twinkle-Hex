import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

/**
 * Shared layout for all customer-facing pages:
 * - Marketing/store pages
 * - Account pages
 * - Community pages
 */
export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
