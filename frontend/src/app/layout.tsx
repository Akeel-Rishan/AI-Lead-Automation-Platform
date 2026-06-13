import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "LeadFlow AI",
  description: "AI-Powered Lead Automation"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <div className="min-h-screen bg-slate-950 text-slate-100">
          <div className="flex min-h-screen">
            <aside className="hidden w-64 shrink-0 border-r border-slate-800 bg-slate-950 px-6 py-7 lg:block">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-cyan-400 text-sm font-black text-slate-950">
                  LF
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">LeadFlow AI</p>
                  <p className="text-xs text-slate-400">Automation CRM</p>
                </div>
              </div>
              <nav className="mt-10 space-y-1 text-sm">
                <a
                  className="block rounded-md bg-slate-900 px-3 py-2 font-medium text-white"
                  href="/dashboard"
                >
                  Dashboard
                </a>
                <a className="block rounded-md px-3 py-2 text-slate-400" href="/dashboard">
                  Leads
                </a>
                <a className="block rounded-md px-3 py-2 text-slate-400" href="/dashboard">
                  Automations
                </a>
                <a className="block rounded-md px-3 py-2 text-slate-400" href="/dashboard">
                  Knowledge Base
                </a>
              </nav>
            </aside>
            <main className="flex-1 bg-slate-900">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
