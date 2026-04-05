import { CommunityPageShell } from "@/components/community";

/**
 * Community layout - channel sidebar + main content.
 * Wraps all /community/* routes.
 */
export default function CommunityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="container mx-auto px-4 py-6">
      <CommunityPageShell>{children}</CommunityPageShell>
    </div>
  );
}
