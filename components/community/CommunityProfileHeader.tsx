import { ReactNode } from "react";

interface CommunityProfileHeaderProps {
  username: string;
  displayName?: string;
  avatarUrl?: string;
  bio?: string;
  badges?: ReactNode;
}

/**
 * Profile header for community profile pages.
 * Future: Verified purchaser badge - check Shopify order history.
 * Future: Swatcher photo gallery link.
 */
export function CommunityProfileHeader({
  username,
  displayName,
  avatarUrl,
  bio,
  badges,
}: CommunityProfileHeaderProps) {
  return (
    <div className="border-b border-ink/10 pb-6">
      <div className="flex items-start gap-4">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt=""
            className="w-16 h-16 rounded-full object-cover"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-plum/20 flex items-center justify-center text-plum font-bold text-xl">
            {username.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-ink">
            {displayName ?? username}
          </h1>
          <p className="text-ink/60">@{username}</p>
          {badges && <div className="mt-2 flex flex-wrap gap-2">{badges}</div>}
          {bio && <p className="mt-3 text-ink/80">{bio}</p>}
        </div>
      </div>
    </div>
  );
}
