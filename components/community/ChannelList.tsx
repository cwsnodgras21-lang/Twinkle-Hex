"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getChannels } from "@/lib/community/channels";
import { useEffect, useState } from "react";
import type { CommunityChannel } from "@/types/community";

/**
 * Channel list sidebar.
 * Future: Real-time channel updates, unread counts.
 */
export function ChannelList() {
  const pathname = usePathname();
  const [channels, setChannels] = useState<CommunityChannel[]>([]);

  useEffect(() => {
    getChannels().then(setChannels);
  }, []);

  return (
    <nav className="sticky top-16 p-4" aria-label="Community channels">
      <h2 className="text-xs font-semibold text-ink/50 uppercase tracking-wider mb-3">
        Channels
      </h2>
      <ul className="space-y-1">
        <li>
          <Link
            href="/community"
            className={`block px-3 py-2 rounded-lg transition-colors ${
              pathname === "/community" ? "bg-teal/10 text-teal font-medium" : "text-ink/80 hover:bg-ink/5"
            }`}
          >
            All
          </Link>
        </li>
        {channels.map((ch) => {
          const isActive = pathname === `/community/channels/${ch.slug}`;
          return (
            <li key={ch.id}>
              <Link
                href={`/community/channels/${ch.slug}`}
                className={`block px-3 py-2 rounded-lg transition-colors ${
                  isActive ? "bg-teal/10 text-teal font-medium" : "text-ink/80 hover:bg-ink/5"
                }`}
              >
                {ch.name}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
