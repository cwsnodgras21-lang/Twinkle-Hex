"use client";

import { useState } from "react";

interface ModerationMenuProps {
  contentId: string;
  contentType: "post" | "reply";
}

/**
 * Moderation dropdown for posts/replies.
 * Future: reportContent(), pin, lock, hide actions.
 */
export function ModerationMenu({ contentId, contentType }: ModerationMenuProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="p-2 text-ink/50 hover:text-ink"
        aria-label="Moderation options"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
        </svg>
      </button>
      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute right-0 mt-1 w-48 py-1 bg-white border border-ink/10 rounded-lg shadow-lg z-20">
            <button
              type="button"
              className="block w-full text-left px-4 py-2 text-sm text-ink hover:bg-ink/5"
              onClick={() => {
                // Future: reportContent(contentType, contentId)
                setOpen(false);
              }}
            >
              Report
            </button>
          </div>
        </>
      )}
    </div>
  );
}
