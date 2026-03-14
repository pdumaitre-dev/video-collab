"use client";

import * as React from "react";
import Link from "next/link";
import {
  formatBytes,
  getAllowedVideoExtensions,
  getBaseFilename,
  getMaxVideoFileSizeBytes,
  validateVideoFile
} from "@/lib/video-upload";

type ValidationState =
  | { type: "idle" }
  | { type: "error"; message: string }
  | { type: "success"; message: string; pathname: string; publicId: string; name: string };

const ALLOWED_EXTENSIONS = getAllowedVideoExtensions();
const MAX_FILE_SIZE_BYTES = getMaxVideoFileSizeBytes();

export default function VideoUploadForm() {
  const [file, setFile] = React.useState<File | null>(null);
  const [name, setName] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [validation, setValidation] = React.useState<ValidationState>({
    type: "idle"
  });

  const derivedName = React.useMemo(() => {
    if (!file) return "";
    return getBaseFilename(file.name);
  }, [file]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0] ?? null;
    setFile(nextFile);
    setName(nextFile ? getBaseFilename(nextFile.name) : "");
    setValidation({ type: "idle" });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!file) {
      setValidation({
        type: "error",
        message: "Choose a video file before continuing."
      });
      return;
    }

    const validationError = validateVideoFile(file);
    if (validationError) {
      setValidation({ type: "error", message: validationError });
      return;
    }

    try {
      setSubmitting(true);

      const formData = new FormData();
      formData.set("file", file);
      formData.set("name", name.trim() || derivedName);

      const response = await fetch("/api/blob/upload", {
        method: "POST",
        body: formData
      });

      const payload = (await response.json()) as
        | { error?: string; pathname?: string; publicId?: string; name?: string }
        | undefined;

      if (!response.ok || !payload?.pathname || !payload.publicId || !payload.name) {
        setValidation({
          type: "error",
          message: payload?.error ?? "Upload failed."
        });
        return;
      }

      setValidation({
        type: "success",
        pathname: payload.pathname,
        publicId: payload.publicId,
        name: payload.name,
        message: "Upload complete. The video is now stored in Blob storage."
      });
    } catch {
      setValidation({
        type: "error",
        message: "Upload failed. Please try again."
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-lg border border-white/[0.08] bg-surface-card p-4"
    >
      <div className="space-y-1">
        <label htmlFor="video-file" className="text-sm font-medium text-fg-primary">
          Video file
        </label>
        <input
          id="video-file"
          name="video-file"
          type="file"
          accept={ALLOWED_EXTENSIONS.join(",")}
          onChange={handleFileChange}
          disabled={submitting}
          className="block w-full rounded-md border border-white/[0.08] bg-surface-page px-3 py-2 text-sm text-fg-primary file:mr-3 file:rounded-md file:border-0 file:bg-accent file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white hover:file:bg-accent-hover"
        />
        <p className="text-xs text-fg-muted">
          Accepted formats: MP4, MOV, WEBM. Max size:{" "}
          {formatBytes(MAX_FILE_SIZE_BYTES)}.
        </p>
      </div>

      <div className="space-y-1">
        <label htmlFor="video-name" className="text-sm font-medium text-fg-primary">
          Video name
        </label>
        <input
          id="video-name"
          name="video-name"
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          disabled={submitting}
          placeholder="Generated from filename"
          className="block w-full rounded-md border border-white/[0.08] bg-surface-page px-3 py-2 text-sm text-fg-primary outline-none focus:border-accent"
        />
        <p className="text-xs text-fg-muted">
          Defaults to the filename without the extension.
        </p>
      </div>

      <div className="grid gap-3 rounded-md border border-white/[0.08] bg-surface-page/50 p-3 text-sm sm:grid-cols-2">
        <MetadataRow
          label="Filename"
          value={file?.name ?? "No file selected"}
        />
        <MetadataRow
          label="Display name"
          value={name || derivedName || "Will be generated from filename"}
        />
        <MetadataRow
          label="File size"
          value={file ? formatBytes(file.size) : "Not available yet"}
        />
        <MetadataRow
          label="Detected type"
          value={file?.type || "Unknown until a file is selected"}
        />
      </div>

      {validation.type !== "idle" && (
        <div
          className={`space-y-2 rounded-md border px-3 py-2 text-sm ${
            validation.type === "error"
              ? "border-rose-900 bg-rose-950/50 text-rose-200"
              : "border-emerald-900 bg-emerald-950/50 text-emerald-200"
          }`}
        >
          <p>{validation.message}</p>
          {validation.type === "success" && (
            <div className="space-y-1">
              <p>
                Assigned ID: <span className="font-mono">{validation.publicId}</span>
              </p>
              <p>Saved name: {validation.name}</p>
              <Link
                href={`/videos/${validation.publicId}`}
                className="inline-flex rounded-md bg-white/10 px-2 py-1 text-sm font-medium no-underline transition-colors hover:bg-white/20"
              >
                Open uploaded video
              </Link>
              <span className="block text-xs text-emerald-300/80">
                Blob path: {validation.pathname}
              </span>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-fg-muted">
          Videos are uploaded to the `videos/` prefix in Vercel Blob.
        </p>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? "Uploading..." : "Upload video"}
        </button>
      </div>
    </form>
  );
}

function MetadataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs uppercase tracking-wide text-fg-muted">{label}</p>
      <p className="break-all text-fg-primary">{value}</p>
    </div>
  );
}
