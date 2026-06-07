"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  createRetailPartnerAction,
  updateRetailPartnerAction,
} from "@/app/admin/actions";
import { getErrorMessage } from "@/lib/errors";
import type { RetailPartner } from "@/types/admin";

const STATUS_OPTIONS: NonNullable<RetailPartner["status"]>[] = [
  "active",
  "inactive",
  "pending",
];

interface RetailPartnerFormProps {
  partner?: RetailPartner | null;
  mode: "create" | "edit";
}

export function RetailPartnerForm({ partner, mode }: RetailPartnerFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);

    try {
      const formData = new FormData(e.currentTarget);
      if (mode === "create") {
        const result = await createRetailPartnerAction(formData);
        if (result.ok) {
          router.push(`/admin/retail-partners/${result.id}`);
          router.refresh();
        } else {
          setError(result.error);
        }
      } else if (partner) {
        const result = await updateRetailPartnerAction(partner.id, formData);
        if (result.ok) {
          router.refresh();
        } else {
          setError(result.error);
        }
      }
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      setPending(false);
    }
  }

  return (
    <form id="partner-form" onSubmit={handleSubmit} method="post" className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-ink mb-1">
          Name *
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          defaultValue={partner?.name}
          className="w-full border border-ink/20 rounded-lg px-3 py-2"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="contact_email" className="block text-sm font-medium text-ink mb-1">
            Contact email
          </label>
          <input
            id="contact_email"
            name="contact_email"
            type="email"
            defaultValue={partner?.contact_email}
            className="w-full border border-ink/20 rounded-lg px-3 py-2"
          />
        </div>
        <div>
          <label htmlFor="contact_phone" className="block text-sm font-medium text-ink mb-1">
            Contact phone
          </label>
          <input
            id="contact_phone"
            name="contact_phone"
            type="text"
            defaultValue={partner?.contact_phone}
            className="w-full border border-ink/20 rounded-lg px-3 py-2"
          />
        </div>
      </div>

      <div>
        <label htmlFor="address" className="block text-sm font-medium text-ink mb-1">
          Address
        </label>
        <textarea
          id="address"
          name="address"
          rows={2}
          defaultValue={partner?.address}
          className="w-full border border-ink/20 rounded-lg px-3 py-2"
        />
      </div>

      <div>
        <label htmlFor="status" className="block text-sm font-medium text-ink mb-1">
          Status
        </label>
        <select
          id="status"
          name="status"
          defaultValue={partner?.status ?? "active"}
          className="w-full border border-ink/20 rounded-lg px-3 py-2"
        >
          {STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-ink mb-1">
          Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          defaultValue={partner?.notes}
          className="w-full border border-ink/20 rounded-lg px-3 py-2"
          placeholder="Account terms, product mix, or follow-up notes"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="px-4 py-2 bg-teal text-white rounded-lg hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "Saving..." : mode === "create" ? "Create" : "Save"}
        </button>
      </div>
    </form>
  );
}
