import { PageHeader } from "@/components/layout/PageHeader";

export default function ShopPage() {
  return (
    <>
      <PageHeader
        title="Shop"
        description="Browse our collection of handcrafted nail polish."
      />
      <div className="container mx-auto px-4 py-8">
        {/* Future: Product grid, filters, collections */}
        <p className="text-plum">Product catalog coming soon.</p>
      </div>
    </>
  );
}
