"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { PolishPrototypePhoto } from "@/types/admin";
import {
  deletePrototypePhotoAction,
  getPrototypePhotoUrlAction,
  uploadPrototypePhotoAction,
} from "@/app/admin/ops-actions";
import { getErrorMessage } from "@/lib/errors";

interface PrototypePhotosPanelProps {
  prototypeId: string;
  photos: PolishPrototypePhoto[];
}

function formatFileSize(bytes?: number): string {
  if (bytes == null) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

/** Small signed-URL thumbnail — fetched lazily since prototype photos live in private storage. */
function PhotoThumb({ photoId, fileName }: { photoId: string; fileName: string }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getPrototypePhotoUrlAction(photoId).then((result) => {
      if (active && result.ok) setUrl(result.url);
    });
    return () => {
      active = false;
    };
  }, [photoId]);

  if (!url) {
    return (
      <div
        className="w-20 h-20 rounded-lg bg-ink/5 border border-ink/10 shrink-0 animate-pulse"
        aria-hidden="true"
      />
    );
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="block w-20 h-20 rounded-lg overflow-hidden border border-ink/10 shrink-0"
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- private signed URLs, not eligible for next/image */}
      <img src={url} alt={fileName} className="w-full h-full object-cover" />
    </a>
  );
}

export function PrototypePhotosPanel({ prototypeId, photos }: PrototypePhotosPanelProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [uploadPending, setUploadPending] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setError(null);
    setUploadPending(true);
    try {
      const formData = new FormData(form);
      const result = await uploadPrototypePhotoAction(prototypeId, formData);
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

  async function handleDelete(photoId: string) {
    if (!window.confirm("Remove this photo? This cannot be undone.")) return;
    setError(null);
    setDeletingId(photoId);
    try {
      const result = await deletePrototypePhotoAction(photoId, prototypeId);
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
          <label htmlFor="photo-file" className="block text-sm font-medium text-ink mb-1">
            Upload photo (JPEG, PNG, WebP, or HEIC, max 10 MB)
          </label>
          <input
            id="photo-file"
            name="file"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
            required
            className="block w-full text-sm text-ink/80 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-teal file:text-white file:cursor-pointer hover:file:opacity-90"
          />
        </div>
        <div>
          <label htmlFor="photo-caption" className="block text-sm font-medium text-ink mb-1">
            Caption (optional)
          </label>
          <input
            id="photo-caption"
            name="caption"
            type="text"
            className="w-full border border-ink/20 rounded-lg px-3 py-2 text-sm"
            placeholder="e.g. Day 3 cure, indirect light"
          />
        </div>
        <button
          type="submit"
          disabled={uploadPending}
          className="px-4 py-2 bg-teal text-white rounded-lg hover:opacity-90 disabled:opacity-50 text-sm"
        >
          {uploadPending ? "Uploading…" : "Upload photo"}
        </button>
      </form>

      {photos.length === 0 ? (
        <p className="text-sm text-ink/60">No photos yet.</p>
      ) : (
        <ul className="space-y-3">
          {photos.map((photo) => (
            <li
              key={photo.id}
              className="flex flex-col sm:flex-row sm:items-center gap-3 border border-ink/10 rounded-lg p-3 bg-white"
            >
              <PhotoThumb photoId={photo.id} fileName={photo.file_name} />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-ink truncate">{photo.file_name}</p>
                <p className="text-sm text-ink/60">
                  {formatDate(photo.uploaded_at)} · {formatFileSize(photo.file_size)}
                  {photo.caption ? ` · ${photo.caption}` : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(photo.id)}
                disabled={deletingId === photo.id}
                className="px-3 py-1.5 text-sm text-magenta border border-magenta/30 rounded-lg hover:bg-magenta/5 disabled:opacity-50 shrink-0"
              >
                {deletingId === photo.id ? "Removing…" : "Remove"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
