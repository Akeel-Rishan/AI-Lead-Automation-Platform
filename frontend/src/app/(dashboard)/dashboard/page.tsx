"use client";

import { Calendar, Flame, TrendingUp, Users } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import LeadScoreBadge from "@/components/leads/LeadScoreBadge";
import { useAuth } from "@/hooks/useAuth";
import type { LeadWithRelations } from "@/hooks/useLeads";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

type LeadsResponse = {
  success: boolean;
  leads: LeadWithRelations[];
  total: number;
};

const sourceBadgeClasses: Record<string, string> = {
  website: "bg-blue-500/15 text-blue-300 ring-blue-500/30",
  facebook: "bg-indigo-500/15 text-indigo-300 ring-indigo-500/30",
  google: "bg-red-500/15 text-red-300 ring-red-500/30",
  sms: "bg-green-500/15 text-green-300 ring-green-500/30",
  email: "bg-yellow-500/15 text-yellow-300 ring-yellow-500/30",
  phone: "bg-purple-500/15 text-purple-300 ring-purple-500/30",
  manual: "bg-slate-700/70 text-slate-200 ring-slate-600"
};

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

function sourceBadge(source: string) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ring-1 ring-inset",
        sourceBadgeClasses[source] ?? "bg-slate-800 text-slate-300 ring-slate-700"
      )}
    >
      {source}
    </span>
  );
}

function timeAgo(date: string) {
  const diffMs = Date.now() - new Date(date).getTime();
  const diffMinutes = Math.max(1, Math.floor(diffMs / 60000));

  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);

  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

export default function DashboardPage() {
  const { user, tenant } = useAuth();
  const [totalLeads, setTotalLeads] = useState(0);
  const [hotLeads, setHotLeads] = useState(0);
  const [recentLeads, setRecentLeads] = useState<LeadWithRelations[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function fetchDashboardData() {
      setIsLoading(true);

      try {
        const [totalResponse, hotResponse, recentResponse] = await Promise.all([
          api.get<LeadsResponse>("/leads?limit=1"),
          api.get<LeadsResponse>("/leads?qualification=hot&limit=1"),
          api.get<LeadsResponse>("/leads?limit=5")
        ]);

        if (isMounted) {
          setTotalLeads(totalResponse.data.total);
          setHotLeads(hotResponse.data.total);
          setRecentLeads(recentResponse.data.leads);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchDashboardData();

    return () => {
      isMounted = false;
    };
  }, []);

  const stats = useMemo(
    () => [
      {
        label: "Total Leads",
        value: isLoading ? "--" : String(totalLeads),
        icon: Users,
        accent: "text-indigo-400",
        bg: "bg-indigo-500/10"
      },
      {
        label: "Hot Leads",
        value: isLoading ? "--" : String(hotLeads),
        icon: Flame,
        accent: "text-orange-400",
        bg: "bg-orange-500/10"
      },
      {
        label: "Appointments",
        value: "0",
        icon: Calendar,
        accent: "text-green-400",
        bg: "bg-green-500/10"
      },
      {
        label: "Conversion Rate",
        value: totalLeads > 0 ? `${Math.round((hotLeads / totalLeads) * 100)}%` : "0%",
        icon: TrendingUp,
        accent: "text-purple-400",
        bg: "bg-purple-500/10"
      }
    ],
    [hotLeads, isLoading, totalLeads]
  );

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
            <article className="rounded-xl border border-slate-800 bg-slate-900 p-5" key={stat.label}>
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
          <div className="flex items-center justify-between gap-4">
            <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
            <Link className="text-sm font-medium text-indigo-300 transition-colors hover:text-indigo-200" href="/leads">
              View all leads
            </Link>
          </div>

          <div className="mt-5 divide-y divide-slate-800">
            {isLoading
              ? Array.from({ length: 5 }).map((_, index) => (
                  <div className="flex items-center gap-4 py-4" key={index}>
                    <div className="h-10 w-10 animate-pulse rounded-full bg-slate-800" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-40 animate-pulse rounded bg-slate-800" />
                      <div className="h-3 w-24 animate-pulse rounded bg-slate-800" />
                    </div>
                  </div>
                ))
              : null}

            {!isLoading && recentLeads.length > 0
              ? recentLeads.map((lead) => (
                  <Link
                    className="flex items-center gap-4 py-4 transition-colors hover:bg-slate-800/40"
                    href={`/leads/${lead.id}`}
                    key={lead.id}
                  >
                    <LeadScoreBadge
                      qualification={lead.qualification ?? lead.qualificationResult?.qualification}
                      score={lead.leadScore ?? lead.qualificationResult?.leadScore}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-white">{lead.name}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        {sourceBadge(lead.source)}
                        <span className="text-xs text-slate-500">{timeAgo(lead.createdAt)}</span>
                      </div>
                    </div>
                  </Link>
                ))
              : null}

            {!isLoading && recentLeads.length === 0 ? (
              <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed border-slate-700 bg-slate-950/40 px-6 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-800">
                  <Users className="h-6 w-6 text-slate-400" />
                </div>
                <p className="mt-4 text-sm font-medium text-white">No leads yet.</p>
                <p className="mt-1 max-w-sm text-sm text-slate-400">Add your first lead to get started.</p>
              </div>
            ) : null}
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
