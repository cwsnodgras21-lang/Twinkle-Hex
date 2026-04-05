import { ReactNode } from "react";

interface PostListProps {
  children: ReactNode;
  empty?: boolean;
  emptyContent?: ReactNode;
}

/**
 * Post list container.
 */
export function PostList({ children, empty, emptyContent }: PostListProps) {
  if (empty) {
    return (
      <div className="py-12">
        {emptyContent ?? (
          <p className="text-center text-ink/60">No posts yet.</p>
        )}
      </div>
    );
  }
  return <ul className="divide-y divide-ink/10">{children}</ul>;
}
