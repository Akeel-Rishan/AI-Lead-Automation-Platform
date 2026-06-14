"use client";

import {
  BarChart3,
  Bell,
  BookOpen,
  Calendar,
  LayoutDashboard,
  LogOut,
  Settings,
  Users,
  Zap
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { isAuthenticated } from "@/lib/auth";
import { useAuth } from "@/hooks/useAuth";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Leads", href: "/leads", icon: Users },
  { label: "Knowledge Base", href: "/knowledge", icon: BookOpen },
  { label: "Automations", href: "/automations", icon: Zap },
  { label: "Appointments", href: "/appointments", icon: Calendar },
  { label: "Analytics", href: "/analytics", icon: BarChart3 },
  { label: "Settings", href: "/settings", icon: Settings }
];

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/leads": "Leads",
  "/knowledge": "Knowledge Base",
  "/automations": "Automations",
  "/appointments": "Appointments",
  "/analytics": "Analytics",
  "/settings": "Settings"
};

function initials(name?: string | null) {
  if (!name) {
    return "LF";
  }

  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, tenant, isLoading, isAuthenticated: hasValidSession, logout } = useAuth();
  const title = pageTitles[pathname] ?? "Dashboard";

  useEffect(() => {
    if (!isLoading && (!hasValidSession || !isAuthenticated())) {
      router.replace("/login");
    }
  }, [hasValidSession, isLoading, router]);

  if (isLoading || !hasValidSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <aside className="fixed inset-y-0 left-0 z-30 hidden h-screen w-64 border-r border-slate-800 bg-slate-900 lg:flex lg:flex-col">
        <div className="border-b border-slate-800 p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10">
              <Zap className="h-5 w-5 text-indigo-500" />
            </div>
            <div>
              <p className="font-semibold text-white">LeadFlow AI</p>
              <span className="mt-1 inline-flex rounded-full bg-indigo-500/10 px-2 py-0.5 text-xs font-medium capitalize text-indigo-400">
                {tenant?.plan ?? "Starter"}
              </span>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                className={cn(
                  "flex items-center gap-3 rounded-lg border-l-2 border-transparent px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "border-indigo-500 bg-indigo-600/10 text-indigo-400"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                )}
                href={item.href}
                key={item.href}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-800 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-sm font-semibold text-white">
              {initials(user?.name)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">{user?.name}</p>
              <p className="truncate text-xs text-slate-400">{user?.email}</p>
              <span className="mt-1 inline-flex rounded-full bg-slate-800 px-2 py-0.5 text-xs capitalize text-slate-300">
                {user?.role}
              </span>
            </div>
          </div>
          <button
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
            onClick={logout}
            type="button"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>

      <div className="lg:ml-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-800 bg-slate-900 px-6">
          <h1 className="text-lg font-semibold text-white">{title}</h1>
          <div className="flex items-center gap-3">
            <button
              aria-label="Notifications"
              className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
              type="button"
            >
              <Bell className="h-5 w-5" />
            </button>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-sm font-semibold text-white">
              {initials(user?.name)}
            </div>
          </div>
        </header>
        <main className="min-h-[calc(100vh-4rem)] bg-slate-950 p-6">{children}</main>
      </div>
    </div>
  );
}
