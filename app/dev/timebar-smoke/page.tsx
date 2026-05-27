import DevVideoShell from "./DevVideoShell";

export const metadata = {
  title: "Timebar smoke (dev)",
  robots: "noindex"
};

/** Blob-free route for cloud-agent timebar drag validation. */
export default function DevTimebarSmokePage() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-fg-secondary">
        Dev-only: local test video, no Vercel Blob calls.
      </p>
      <DevVideoShell
        sourceUrl="/videos/env-smoke.mp4"
        title="Env smoke — timebar drag"
      />
    </div>
  );
}
