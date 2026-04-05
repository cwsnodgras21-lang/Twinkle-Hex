import { PageHeader } from "@/components/layout/PageHeader";

interface ProductPageProps {
  params: Promise<{ handle: string }>;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { handle } = await params;

  return (
    <>
      <PageHeader title="Product" />
      <div className="container mx-auto px-4 py-8">
        {/* Future: Product details, add to cart, variant selector */}
        <p className="text-plum">Product: {handle}</p>
      </div>
    </>
  );
}
