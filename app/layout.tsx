import "./globals.css";
import { Space_Grotesk, Manrope } from "next/font/google";
import Script from "next/script";
import type { ReactNode } from "react";

import SiteHeader from "@/components/SiteHeader";

const fontHeading = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap"
});

const fontBody = Manrope({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap"
});

export const metadata = {
  title: "Ballet Booster",
  description: "Annotate videos with time-range comments"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${fontHeading.variable} ${fontBody.variable}`}>
      <body className="min-h-screen">
        {process.env.NODE_ENV === "development" && (
          <Script
            src="https://mcp.figma.com/mcp/html-to-design/capture.js"
            strategy="beforeInteractive"
          />
        )}
        <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-4 py-6">
          <SiteHeader />
          <main className="flex-1">{children}</main>
        </div>
      </body>
    </html>
  );
}

