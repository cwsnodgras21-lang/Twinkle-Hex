"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createRevenueEntryAction } from "@/app/admin/ops-actions";
import { getErrorMessage } from "@/lib/errors";

const SOURCE_OPTIONS = [
  { value: "LLB", label: "LLB" },
  { value: "SOU", label: "SOU" },
  { value: "LBOH", label: "LBOH" },
  { value: "other", label: "Other" },
];

/**
 * Manually logs program revenue (LLB / SOU / LBOH / other) — Shopify rolls
 * up automatically and is not entered here.
 */
export function RevenueEntryForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const field =
    "w-full border border-ink/20 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const formData = new FormData(e.currentTarget);
      const result = await createRevenueEntryAction(formData);
      if (result.ok) {
        e.currentTarget.reset();
        router.refresh();
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="received_date" className="block text-sm font-medium text-ink mb-1">
            Date received *
          </label>
          <input
            id="received_date"
            name="received_date"
            type="date"
            required
            defaultValue={new Date().toISOString().slice(0, 10)}
            className={field}
          />
        </div>
        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-ink mb-1">
            Amount ($) *
          </label>
          <input id="amount" name="amount" type="number" min="0" step="0.01" required className={field} placeholder="0.00" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="source" className="block text-sm font-medium text-ink mb-1">
            Source *
          </label>
          <select id="source" name="source" required defaultValue="LLB" className={field}>
            {SOURCE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="payment_method" className="block text-sm font-medium text-ink mb-1">
            Payment method
          </label>
          <input id="payment_method" name="payment_method" type="text" defaultValue="paypal" className={field} />
        </div>
      </div>
      <div>
        <label htmlFor="external_reference" className="block text-sm font-medium text-ink mb-1">
          External reference
        </label>
        <input
          id="external_reference"
          name="external_reference"
          type="text"
          className={field}
          placeholder="PayPal transaction ID, invoice #, etc."
        />
      </div>
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-ink mb-1">
          Notes
        </label>
        <textarea id="notes" name="notes" rows={2} className={field} />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="px-4 py-2 bg-teal text-white rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
      >
        {pending ? "Saving…" : "Log revenue"}
      </button>
    </form>
  );
}
