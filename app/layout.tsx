import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Feedback Inbox",
    template: "%s · Feedback Inbox",
  },
  description:
    "Collect feedback from residents and families, and let staff triage it. A Next.js + Supabase demo.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <header className="border-b border-line bg-white">
          <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-4">
            <Link href="/" className="flex items-center gap-2 text-lg font-semibold">
              <span
                aria-hidden="true"
                className="inline-flex size-8 items-center justify-center rounded-lg bg-accent text-sm text-white"
              >
                FI
              </span>
              Feedback Inbox
            </Link>
            <nav aria-label="Main" className="flex gap-1 text-sm font-medium">
              <Link href="/" className="rounded-md px-3 py-2 hover:bg-canvas">
                Give feedback
              </Link>
              <Link href="/dashboard" className="rounded-md px-3 py-2 hover:bg-canvas">
                Staff dashboard
              </Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:py-12">{children}</main>
        <footer className="border-t border-line bg-white">
          <p className="mx-auto max-w-5xl px-4 py-4 text-sm text-muted">
            Demo app built with Next.js, Supabase, Inngest and Discord.
          </p>
        </footer>
      </body>
    </html>
  );
}
