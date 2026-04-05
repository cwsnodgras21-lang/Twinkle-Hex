import { PageHeader } from "@/components/layout/PageHeader";

export default function OrdersPage() {
  return (
    <>
      <PageHeader
        title="Order History"
        description="View and track your orders."
      />
      <div>
        {/* Future: Orders list, order details, tracking */}
        <p className="text-plum">Order history coming soon.</p>
      </div>
    </>
  );
}
