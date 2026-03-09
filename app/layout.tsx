import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "Video Annotation MVP",
  description: "Annotate videos with time-range comments"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-slate-50">
        <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-4 py-6">
          <header className="mb-4 border-b border-slate-800 pb-3">
            <h1 className="text-xl font-semibold tracking-tight">
              Video Annotation MVP
            </h1>
          </header>
          <main className="flex-1">{children}</main>
        </div>
      </body>
    </html>
  );
}

