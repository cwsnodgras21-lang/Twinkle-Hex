"use client";

import { ReactNode } from "react";

interface DetailDrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

/**
 * Slide-out drawer for detail views (order, customer, etc.).
 * Mobile-friendly overlay; desktop can use side panel.
 */
export function DetailDrawer({ open, onClose, title, children }: DetailDrawerProps) {
  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-ink/40 z-50 md:bg-transparent"
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-xl z-50 overflow-y-auto"
        role="dialog"
        aria-label={title}
      >
        <div className="sticky top-0 bg-white border-b border-ink/10 px-4 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-ink/70 hover:text-ink"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-4">{children}</div>
      </aside>
    </>
  );
}
