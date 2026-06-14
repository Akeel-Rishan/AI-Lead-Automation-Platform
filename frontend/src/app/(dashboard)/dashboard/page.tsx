"use client";

import { Calendar, Flame, TrendingUp, Users } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

const stats = [
  {
    label: "Total Leads",
    value: "--",
    icon: Users,
    accent: "text-indigo-400",
    bg: "bg-indigo-500/10"
  },
  {
    label: "Hot Leads",
    value: "--",
    icon: Flame,
    accent: "text-orange-400",
    bg: "bg-orange-500/10"
  },
  {
    label: "Appointments",
    value: "--",
    icon: Calendar,
    accent: "text-green-400",
    bg: "bg-green-500/10"
  },
  {
    label: "Conversion Rate",
    value: "--",
    icon: TrendingUp,
    accent: "text-purple-400",
    bg: "bg-purple-500/10"
  }
];

function greeting() {
  const hour = new Date().getHours();

  if (hour < 12) {
    return "Good morning";
  }

  if (hour < 18) {
    return "Good afternoon";
  }

  return "Good evening";
}

export default function DashboardPage() {
  const { user, tenant } = useAuth();

  return (
    <div>
      <header>
        <h2 className="text-2xl font-bold text-white">
          {greeting()}, {user?.name ?? "there"}
        </h2>
        <p className="mt-2 text-sm capitalize text-slate-400">
          {tenant?.name ?? "LeadFlow AI"} - {tenant?.plan ?? "starter"} plan
        </p>
      </header>

      <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <article
              className="rounded-xl border border-slate-800 bg-slate-900 p-5"
              key={stat.label}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">{stat.label}</p>
                  <p className="mt-3 text-3xl font-bold text-white">{stat.value}</p>
                </div>
                <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${stat.bg}`}>
                  <Icon className={`h-5 w-5 ${stat.accent}`} />
                </div>
              </div>
            </article>
          );
        })}
      </section>

      <section className="mt-8 grid gap-4 xl:grid-cols-[3fr_2fr]">
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
          <h3 className="text-lg font-semibold text-white">Recent Leads</h3>
          <div className="mt-8 flex min-h-72 flex-col items-center justify-center rounded-xl border border-dashed border-slate-700 bg-slate-950/40 px-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-800">
              <Users className="h-6 w-6 text-slate-400" />
            </div>
            <p className="mt-4 text-sm font-medium text-white">No leads yet.</p>
            <p className="mt-1 max-w-sm text-sm text-slate-400">
              Add your first lead to get started.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
          <h3 className="text-lg font-semibold text-white">Quick Actions</h3>
          <div className="mt-6 space-y-3">
            <Link
              className="block rounded-lg bg-indigo-600 px-4 py-3 text-center text-sm font-medium text-white transition-colors hover:bg-indigo-500"
              href="/leads/new"
            >
              Add Lead Manually
            </Link>
            <Link
              className="block rounded-lg bg-slate-800 px-4 py-3 text-center text-sm font-medium text-slate-200 transition-colors hover:bg-slate-700"
              href="/knowledge"
            >
              Upload Document
            </Link>
            <Link
              className="block rounded-lg bg-slate-800 px-4 py-3 text-center text-sm font-medium text-slate-200 transition-colors hover:bg-slate-700"
              href="/analytics"
            >
              View Analytics
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
