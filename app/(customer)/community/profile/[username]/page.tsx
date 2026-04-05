import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { CommunityProfileHeader, BadgeChip } from "@/components/community";
import { getProfileByUsername } from "@/lib/community/profiles";
import { getBadgesForProfile } from "@/lib/community/badges";

interface Props {
  params: Promise<{ username: string }>;
}

export default async function CommunityProfilePage({ params }: Props) {
  const { username } = await params;
  const profile = await getProfileByUsername(username);
  if (!profile) notFound();

  const badges = await getBadgesForProfile(profile.id);

  return (
    <>
      <PageHeader title="Profile" />
      <CommunityProfileHeader
        username={profile.username}
        displayName={profile.display_name}
        avatarUrl={profile.avatar_url}
        bio={profile.bio}
        badges={
          badges.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {badges.map((b) => (
                <BadgeChip key={b.id} badge={b} />
              ))}
            </div>
          ) : undefined
        }
      />
      {/* Future: verified purchaser badge - check Shopify order history */}
      {/* Future: swatcher photo submissions */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-ink mb-4">Posts</h2>
        <p className="text-sm text-ink/60">User posts will appear here.</p>
      </div>
    </>
  );
}
