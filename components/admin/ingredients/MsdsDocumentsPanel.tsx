"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { IngredientMsdsDocument } from "@/types/admin";
import {
  deleteIngredientMsdsAction,
  getIngredientMsdsDownloadUrlAction,
  uploadIngredientMsdsAction,
} from "@/app/admin/actions";
import { getErrorMessage } from "@/lib/errors";

interface MsdsDocumentsPanelProps {
  ingredientId: string;
  documents: IngredientMsdsDocument[];
}

function formatFileSize(bytes?: number): string {
  if (bytes == null) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function MsdsDocumentsPanel({ ingredientId, documents }: MsdsDocumentsPanelProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [uploadPending, setUploadPending] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [openingId, setOpeningId] = useState<string | null>(null);

  async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setError(null);
    setUploadPending(true);
    try {
      const formData = new FormData(form);
      const result = await uploadIngredientMsdsAction(ingredientId, formData);
      if (result.ok) {
        form.reset();
        router.refresh();
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setUploadPending(false);
    }
  }

  async function handleOpen(documentId: string) {
    setError(null);
    setOpeningId(documentId);
    try {
      const result = await getIngredientMsdsDownloadUrlAction(documentId);
      if (result.ok) {
        window.open(result.url, "_blank", "noopener,noreferrer");
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setOpeningId(null);
    }
  }

  async function handleDelete(documentId: string) {
    if (!window.confirm("Remove this MSDS sheet? This cannot be undone.")) return;
    setError(null);
    setDeletingId(documentId);
    try {
      const result = await deleteIngredientMsdsAction(ingredientId, documentId);
      if (result.ok) {
        router.refresh();
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
      )}

      <form onSubmit={handleUpload} className="space-y-3 border border-ink/10 rounded-lg p-4 bg-ink/[0.02]">
        <div>
          <label htmlFor="msds-file" className="block text-sm font-medium text-ink mb-1">
            Upload MSDS sheet (PDF, max 10 MB)
          </label>
          <input
            id="msds-file"
            name="file"
            type="file"
            accept="application/pdf,.pdf"
            required
            className="block w-full text-sm text-ink/80 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-teal file:text-white file:cursor-pointer hover:file:opacity-90"
          />
        </div>
        <div>
          <label htmlFor="msds-notes" className="block text-sm font-medium text-ink mb-1">
            Notes (optional)
          </label>
          <input
            id="msds-notes"
            name="notes"
            type="text"
            className="w-full border border-ink/20 rounded-lg px-3 py-2 text-sm"
            placeholder="e.g. Revised 2024, lot-specific"
          />
        </div>
        <button
          type="submit"
          disabled={uploadPending}
          className="px-4 py-2 bg-teal text-white rounded-lg hover:opacity-90 disabled:opacity-50 text-sm"
        >
          {uploadPending ? "Uploading…" : "Upload MSDS"}
        </button>
      </form>

      {documents.length === 0 ? (
        <p className="text-sm text-ink/60">No MSDS sheets attached yet.</p>
      ) : (
        <ul className="divide-y divide-ink/10 border border-ink/10 rounded-lg overflow-hidden">
          {documents.map((doc) => (
            <li
              key={doc.id}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 bg-white"
            >
              <div className="min-w-0">
                <p className="font-medium text-ink truncate">{doc.file_name}</p>
                <p className="text-sm text-ink/60">
                  Uploaded {formatDate(doc.uploaded_at)} · {formatFileSize(doc.file_size)}
                  {doc.notes ? ` · ${doc.notes}` : ""}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleOpen(doc.id)}
                  disabled={openingId === doc.id}
                  className="px-3 py-1.5 text-sm border border-ink/20 rounded-lg hover:bg-ink/5 disabled:opacity-50"
                >
                  {openingId === doc.id ? "Opening…" : "View PDF"}
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(doc.id)}
                  disabled={deletingId === doc.id}
                  className="px-3 py-1.5 text-sm text-magenta border border-magenta/30 rounded-lg hover:bg-magenta/5 disabled:opacity-50"
                >
                  {deletingId === doc.id ? "Removing…" : "Remove"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
