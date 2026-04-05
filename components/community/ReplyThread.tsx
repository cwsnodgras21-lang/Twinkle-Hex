import { ReactNode } from "react";

interface ReplyThreadProps {
  children: ReactNode;
}

/**
 * Reply thread container.
 * Future: Nested reply indentation.
 * Future: Real-time updates (when implemented).
 */
export function ReplyThread({ children }: ReplyThreadProps) {
  return <div className="space-y-4">{children}</div>;
}
