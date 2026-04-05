import { PageHeader } from "@/components/layout/PageHeader";

export default function AboutPage() {
  return (
    <>
      <PageHeader
        title="About Us"
        description="The story behind Twinkle & Hex."
      />
      <div className="container mx-auto px-4 py-8">
        {/* Future: Brand story, team, values */}
        <p className="text-plum">Our story coming soon.</p>
      </div>
    </>
  );
}
