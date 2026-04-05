interface PageHeaderProps {
  title: string;
  description?: string;
}

/**
 * Reusable page header for consistent section titles.
 * Future: Add breadcrumbs, back links, or action buttons via props.
 */
export function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <div className="border-b border-ink/10 bg-white">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl md:text-3xl font-bold text-ink">{title}</h1>
        {description && (
          <p className="mt-2 text-plum">{description}</p>
        )}
      </div>
    </div>
  );
}
