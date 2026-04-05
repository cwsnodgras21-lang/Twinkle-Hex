/**
 * Shared TypeScript types.
 * Future: Product, Order, Customer, User, CommunityPost, etc.
 */

// Placeholder types - extend as features are built
export interface Product {
  id: string;
  handle: string;
  title: string;
  // Future: price, variants, images, etc.
}

export interface User {
  id: string;
  email?: string;
  role?: string;
}
