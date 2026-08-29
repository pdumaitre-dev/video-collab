/**
 * Returns a safe same-origin path for post-login redirect.
 * Rejects protocol-relative URLs and external schemes.
 */
export function safeRedirectPath(next: string | null | undefined): string {
  if (next == null || typeof next !== "string") return "/";
  const trimmed = next.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return "/";
  if (/[\r\n\\]/.test(trimmed)) return "/";
  return trimmed;
}
