import { PageHeader } from "@/components/layout/PageHeader";

export default function AccountPage() {
  return (
    <>
      <PageHeader
        title="My Account"
        description="Manage your account and orders."
      />
      <div>
        {/* Future: Account overview, recent orders, profile summary */}
        <p className="text-plum">Account dashboard coming soon.</p>
      </div>
    </>
  );
}
