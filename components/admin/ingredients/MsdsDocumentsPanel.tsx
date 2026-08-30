"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { IngredientMsdsDocument } from "@/types/admin";
import {
  deleteIngredientMsdsAction,
  getIngredientMsdsDownloadUrlAction,
  linkIngredientGoogleDriveSdsAction,
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
  const [drivePending, setDrivePending] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [openingId, setOpeningId] = useState<string | null>(null);

  async function handleDriveLink(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setError(null);
    setDrivePending(true);
    try {
      const formData = new FormData(form);
      const result = await linkIngredientGoogleDriveSdsAction(ingredientId, formData);
      if (result.ok) {
        form.reset();
        router.refresh();
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setDrivePending(false);
    }
  }

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
    if (!window.confirm("Remove this SDS link? This cannot be undone.")) return;
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
      <p className="text-sm text-ink/60">
        Google Drive is the long-term source of truth for SDS. Local PDF uploads are legacy only.
      </p>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
      )}

      <form onSubmit={handleDriveLink} className="space-y-3 border border-teal/20 rounded-lg p-4 bg-teal/[0.04]">
        <p className="text-sm font-medium text-ink">Link Google Drive SDS (preferred)</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="drive-file-name" className="block text-sm font-medium text-ink mb-1">
              File name
            </label>
            <input
              id="drive-file-name"
              name="file_name"
              type="text"
              required
              className="w-full border border-ink/20 rounded-lg px-3 py-2 text-sm"
              placeholder="Aurora Chrome SDS.pdf"
            />
          </div>
          <div>
            <label htmlFor="drive-file-id" className="block text-sm font-medium text-ink mb-1">
              Drive file ID
            </label>
            <input
              id="drive-file-id"
              name="google_drive_file_id"
              type="text"
              required
              className="w-full border border-ink/20 rounded-lg px-3 py-2 text-sm"
              placeholder="1abc…"
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="drive-url" className="block text-sm font-medium text-ink mb-1">
              Drive link
            </label>
            <input
              id="drive-url"
              name="google_drive_url"
              type="url"
              required
              className="w-full border border-ink/20 rounded-lg px-3 py-2 text-sm"
              placeholder="https://drive.google.com/…"
            />
          </div>
          <div>
            <label htmlFor="drive-verified" className="block text-sm font-medium text-ink mb-1">
              Verified date (optional)
            </label>
            <input
              id="drive-verified"
              name="verified_at"
              type="date"
              className="w-full border border-ink/20 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="drive-notes" className="block text-sm font-medium text-ink mb-1">
              Notes (optional)
            </label>
            <input
              id="drive-notes"
              name="notes"
              type="text"
              className="w-full border border-ink/20 rounded-lg px-3 py-2 text-sm"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={drivePending}
          className="px-4 py-2 bg-teal text-white rounded-lg hover:opacity-90 disabled:opacity-50 text-sm"
        >
          {drivePending ? "Linking…" : "Link Drive SDS"}
        </button>
      </form>

      <form onSubmit={handleUpload} className="space-y-3 border border-ink/10 rounded-lg p-4 bg-ink/[0.02]">
        <div>
          <label htmlFor="msds-file" className="block text-sm font-medium text-ink mb-1">
            Legacy: upload PDF to app storage
          </label>
          <input
            id="msds-file"
            name="file"
            type="file"
            accept="application/pdf,.pdf"
            required
            className="block w-full text-sm text-ink/80 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-ink/70 file:text-white file:cursor-pointer"
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
          className="px-4 py-2 border border-ink/20 rounded-lg hover:bg-ink/5 disabled:opacity-50 text-sm"
        >
          {uploadPending ? "Uploading…" : "Upload PDF (legacy)"}
        </button>
      </form>

      {documents.length === 0 ? (
        <p className="text-sm text-ink/60">No SDS linked yet — pigments need an SDS for compliance.</p>
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
                  {doc.source === "google_drive" ? "Google Drive" : "App storage"} ·{" "}
                  {formatDate(doc.uploaded_at)}
                  {doc.file_size ? ` · ${formatFileSize(doc.file_size)}` : ""}
                  {doc.verified_at ? ` · verified ${doc.verified_at}` : ""}
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
                  {openingId === doc.id ? "Opening…" : doc.source === "google_drive" ? "Open Drive" : "View PDF"}
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
