/**
 * Community forum domain models.
 * Supabase tables will map to these shapes.
 */

// --- Channels (topic categories) ---
export interface CommunityChannel {
  id: string;
  slug: string;
  name: string;
  description?: string;
  icon?: string;
  sort_order: number;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

// --- Posts (discussion threads) ---
export type PostStatus = "published" | "pinned" | "locked" | "hidden";

export interface CommunityPost {
  id: string;
  channel_id: string;
  author_id: string;
  title: string;
  body: string;
  status: PostStatus;
  reply_count: number;
  view_count?: number;
  last_activity_at: string;
  created_at: string;
  updated_at: string;
}

// --- Replies ---
export interface CommunityReply {
  id: string;
  post_id: string;
  author_id: string;
  parent_reply_id?: string; // For nested replies
  body: string;
  created_at: string;
  updated_at: string;
}

// --- Profiles (extends user, community-specific) ---
export interface CommunityProfile {
  id: string;
  user_id: string;
  username: string;
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  badge_ids: string[];
  created_at: string;
  updated_at: string;
}

// --- Badges (verified purchaser, swatcher, etc.) ---
export type BadgeType = "verified_purchaser" | "swatcher" | "moderator" | "brand" | "custom";

export interface CommunityBadge {
  id: string;
  type: BadgeType;
  label: string;
  icon?: string;
  /** Future: verified_purchaser - check Shopify order history before granting */
  created_at: string;
  updated_at: string;
}

// --- Moderation reports ---
export type ReportStatus = "pending" | "reviewed" | "resolved" | "dismissed";

export interface ModerationReport {
  id: string;
  reporter_id: string;
  content_type: "post" | "reply" | "profile";
  content_id: string;
  reason?: string;
  status: ReportStatus;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
  updated_at: string;
}
