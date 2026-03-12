"use client";

import * as React from "react";

const ALLOWED_EXTENSIONS = [".mp4", ".mov", ".webm"];
const MAX_FILE_SIZE_BYTES = 500 * 1024 * 1024;

type ValidationState =
  | { type: "idle" }
  | { type: "error"; message: string }
  | { type: "success"; message: string };

export default function VideoUploadForm() {
  const [file, setFile] = React.useState<File | null>(null);
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
    setValidation({ type: "idle" });
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
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

    setValidation({
      type: "success",
      message: "Validation passed. The actual upload will be added in step 2."
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-md border border-slate-800 bg-slate-900/60 p-4"
    >
      <div className="space-y-1">
        <label htmlFor="video-file" className="text-sm font-medium text-slate-100">
          Video file
        </label>
        <input
          id="video-file"
          name="video-file"
          type="file"
          accept={ALLOWED_EXTENSIONS.join(",")}
          onChange={handleFileChange}
          className="block w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 file:mr-3 file:rounded-md file:border-0 file:bg-sky-500 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-slate-950 hover:file:bg-sky-400"
        />
        <p className="text-xs text-slate-400">
          Accepted formats: MP4, MOV, WEBM. Max size:{" "}
          {formatBytes(MAX_FILE_SIZE_BYTES)}.
        </p>
      </div>

      <div className="grid gap-3 rounded-md border border-slate-800 bg-slate-950/70 p-3 text-sm sm:grid-cols-2">
        <MetadataRow
          label="Filename"
          value={file?.name ?? "No file selected"}
        />
        <MetadataRow
          label="Derived name"
          value={derivedName || "Will be generated from filename"}
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
        <p
          className={`rounded-md border px-3 py-2 text-sm ${
            validation.type === "error"
              ? "border-rose-900 bg-rose-950/50 text-rose-200"
              : "border-emerald-900 bg-emerald-950/50 text-emerald-200"
          }`}
        >
          {validation.message}
        </p>
      )}

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-slate-500">
          This step validates the form only. No upload request is sent yet.
        </p>
        <button
          type="submit"
          className="rounded-md bg-sky-500 px-3 py-2 text-sm font-medium text-slate-950 hover:bg-sky-400"
        >
          Validate form
        </button>
      </div>
    </form>
  );
}

function MetadataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="break-all text-slate-100">{value}</p>
    </div>
  );
}

function validateVideoFile(file: File): string | null {
  const extension = getExtension(file.name);

  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    return "Choose an .mp4, .mov, or .webm video.";
  }

  if (file.type && !file.type.startsWith("video/")) {
    return "The selected file does not look like a video.";
  }

  if (file.size <= 0) {
    return "The selected file is empty.";
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return `The selected file exceeds the ${formatBytes(MAX_FILE_SIZE_BYTES)} limit.`;
  }

  return null;
}

function getExtension(filename: string): string {
  const dotIndex = filename.lastIndexOf(".");
  if (dotIndex === -1) return "";
  return filename.slice(dotIndex).toLowerCase();
}

function getBaseFilename(filename: string): string {
  const dotIndex = filename.lastIndexOf(".");
  if (dotIndex === -1) return filename;
  return filename.slice(0, dotIndex);
}

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;

  const units = ["KB", "MB", "GB", "TB"];
  let value = bytes / 1024;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value.toFixed(1)} ${units[unitIndex]}`;
}
