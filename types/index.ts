/**
 * Shared TypeScript types.
 * Admin domain types (Ingredient, Polish, FinishedInventoryItem, ...) live in ./admin.ts.
 */

export interface User {
  id: string;
  email?: string;
  role?: string;
}
