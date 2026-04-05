import Link from "next/link";
import { ReactNode } from "react";
import { ChannelList } from "./ChannelList";

interface CommunityPageShellProps {
  children: ReactNode;
  /** Optional - show channel sidebar. Default true on desktop. */
  showSidebar?: boolean;
}

/**
 * Community layout shell - channel sidebar + main content.
 * Mobile: sidebar hidden, Channels link shown; desktop: sidebar visible.
 */
export function CommunityPageShell({ children, showSidebar = true }: CommunityPageShellProps) {
  return (
    <div className="flex min-h-[60vh]">
      {showSidebar && (
        <aside className="hidden lg:block w-64 flex-shrink-0 border-r border-ink/10 bg-white/50">
          <ChannelList />
        </aside>
      )}
      <div className="flex-1 min-w-0">
        {/* Mobile: quick link to channels when sidebar is hidden */}
        <div className="lg:hidden mb-4">
          <Link
            href="/community/channels"
            className="inline-flex items-center gap-2 text-sm text-teal hover:underline"
          >
            Browse channels
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
        {children}
      </div>
    </div>
  );
}
