const ALLOWED_EXTENSIONS = [".mp4", ".mov", ".webm"] as const;
const MAX_FILE_SIZE_BYTES = 500 * 1024 * 1024;

export function getAllowedVideoExtensions() {
  return [...ALLOWED_EXTENSIONS];
}

export function getMaxVideoFileSizeBytes() {
  return MAX_FILE_SIZE_BYTES;
}

export function validateVideoFile(file: Pick<File, "name" | "size" | "type">): string | null {
  const extension = getExtension(file.name);

  if (!ALLOWED_EXTENSIONS.includes(extension as (typeof ALLOWED_EXTENSIONS)[number])) {
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

export function getBaseFilename(filename: string): string {
  const dotIndex = filename.lastIndexOf(".");
  if (dotIndex === -1) return filename;
  return filename.slice(0, dotIndex);
}

export function buildVideoBlobPath(filename: string): string {
  return `videos/${sanitizeFilename(filename)}`;
}

export function formatBytes(bytes: number): string {
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

function getExtension(filename: string): string {
  const dotIndex = filename.lastIndexOf(".");
  if (dotIndex === -1) return "";
  return filename.slice(dotIndex).toLowerCase();
}

function sanitizeFilename(filename: string): string {
  return filename
    .trim()
    .replace(/^videos\//i, "")
    .replace(/[^\w.\- ]+/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}
