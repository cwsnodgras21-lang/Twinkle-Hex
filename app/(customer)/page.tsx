import Link from "next/link";

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <section className="text-center max-w-2xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold text-ink mb-4">
          Twinkle & Hex
        </h1>
        <p className="text-lg text-plum mb-8">
          Handcrafted indie nail polish for the bold and creative.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/shop"
            className="px-6 py-3 bg-cyan text-ink font-semibold rounded-lg hover:opacity-90 transition-opacity"
          >
            Shop Now
          </Link>
          <Link
            href="/about"
            className="px-6 py-3 border-2 border-plum text-plum font-semibold rounded-lg hover:bg-plum hover:text-white transition-colors"
          >
            Our Story
          </Link>
        </div>
      </section>
    </div>
  );
}
