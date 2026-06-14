"use client";

import { Edit, Eye, Plus, Search, Trash2, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import AddLeadModal from "@/components/leads/AddLeadModal";
import LeadStatusBadge from "@/components/leads/LeadStatusBadge";
import { useLeads, type LeadWithRelations } from "@/hooks/useLeads";
import { cn } from "@/lib/utils";

const statusOptions = [
  { value: "", label: "All" },
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "qualified", label: "Qualified" },
  { value: "unqualified", label: "Unqualified" },
  { value: "converted", label: "Converted" },
  { value: "lost", label: "Lost" }
];

const sourceOptions = [
  { value: "", label: "All" },
  { value: "website", label: "Website" },
  { value: "facebook", label: "Facebook" },
  { value: "google", label: "Google" },
  { value: "sms", label: "SMS" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "manual", label: "Manual" }
];

const qualificationOptions = [
  { value: "", label: "All" },
  { value: "hot", label: "Hot" },
  { value: "warm", label: "Warm" },
  { value: "cold", label: "Cold" }
];

const sourceBadgeClasses: Record<string, string> = {
  website: "bg-blue-500/15 text-blue-300 ring-blue-500/30",
  facebook: "bg-indigo-500/15 text-indigo-300 ring-indigo-500/30",
  google: "bg-red-500/15 text-red-300 ring-red-500/30",
  sms: "bg-green-500/15 text-green-300 ring-green-500/30",
  email: "bg-yellow-500/15 text-yellow-300 ring-yellow-500/30",
  phone: "bg-purple-500/15 text-purple-300 ring-purple-500/30",
  manual: "bg-slate-700/70 text-slate-200 ring-slate-600"
};

function sourceLabel(source: string) {
  return source.charAt(0).toUpperCase() + source.slice(1);
}

function sourceBadge(source: string) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        sourceBadgeClasses[source] ?? "bg-slate-800 text-slate-300 ring-slate-700"
      )}
    >
      {sourceLabel(source)}
    </span>
  );
}

function scoreCell(lead: LeadWithRelations) {
  const score = lead.leadScore ?? lead.qualificationResult?.leadScore ?? null;

  if (score === null) {
    return (
      <span className="inline-flex items-center gap-2 text-sm text-slate-500">
        <span className="h-2 w-2 rounded-full bg-slate-600" />
        --
      </span>
    );
  }

  const dotClassName = score >= 90 ? "bg-green-400" : score >= 70 ? "bg-yellow-400" : "bg-red-400";

  return (
    <span className="inline-flex items-center gap-2 text-sm font-medium text-slate-200">
      <span className={cn("h-2 w-2 rounded-full", dotClassName)} />
      {score}
    </span>
  );
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(date));
}

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, index) => (
        <tr className="border-t border-slate-800" key={index}>
          {Array.from({ length: 8 }).map((__, cellIndex) => (
            <td className="px-4 py-4" key={cellIndex}>
              <div className="h-4 animate-pulse rounded bg-slate-800" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export default function LeadsPage() {
  const router = useRouter();
  const {
    leads,
    total,
    page,
    limit,
    isLoading,
    error,
    filters,
    setFilters,
    createLead,
    fetchLeads,
    deleteLead
  } = useLeads();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const totalPages = Math.max(1, Math.ceil(total / limit));

  async function handleDelete(id: string) {
    const confirmed = window.confirm("Delete this lead?");

    if (confirmed) {
      await deleteLead(id);
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Leads</h2>
          <p className="mt-1 text-sm text-slate-400">{total} total</p>
        </div>
        <button
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500"
          onClick={() => setIsModalOpen(true)}
          type="button"
        >
          <Plus className="h-4 w-4" />
          Add Lead
        </button>
      </header>

      <section className="grid gap-3 rounded-xl border border-slate-800 bg-slate-900 p-4 md:grid-cols-[1fr_180px_180px_160px]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            className="w-full rounded-lg border border-slate-700 bg-slate-950 py-2 pl-10 pr-3 text-sm text-white outline-none transition-colors placeholder:text-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            onChange={(event) => setFilters({ search: event.target.value })}
            placeholder="Search by name, email, phone..."
            type="search"
            value={filters.search ?? ""}
          />
        </div>
        <select
          className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          onChange={(event) => setFilters({ status: event.target.value })}
          value={filters.status ?? ""}
        >
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <select
          className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          onChange={(event) => setFilters({ source: event.target.value })}
          value={filters.source ?? ""}
        >
          {sourceOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <select
          className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          onChange={(event) => setFilters({ qualification: event.target.value })}
          value={filters.qualification ?? ""}
        >
          {qualificationOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </section>

      {error ? (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <section className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-800">
            <thead className="bg-slate-950/40">
              <tr>
                {["Name", "Source", "Service", "Score", "Status", "Qualification", "Created", "Actions"].map(
                  (heading) => (
                    <th
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400"
                      key={heading}
                    >
                      {heading}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {isLoading ? <SkeletonRows /> : null}
              {!isLoading && leads.length > 0
                ? leads.map((lead) => (
                    <tr
                      className="cursor-pointer border-t border-slate-800 transition-colors hover:bg-slate-800/40"
                      key={lead.id}
                      onClick={() => router.push(`/leads/${lead.id}`)}
                    >
                      <td className="px-4 py-4">
                        <p className="font-medium text-white">{lead.name}</p>
                        <p className="mt-1 text-sm text-slate-400">{lead.email ?? lead.phone ?? "--"}</p>
                      </td>
                      <td className="px-4 py-4">{sourceBadge(lead.source)}</td>
                      <td className="px-4 py-4 text-sm text-slate-300">{lead.service ?? "--"}</td>
                      <td className="px-4 py-4">{scoreCell(lead)}</td>
                      <td className="px-4 py-4">
                        <LeadStatusBadge status={lead.status} />
                      </td>
                      <td className="px-4 py-4">
                        <LeadStatusBadge status={lead.qualification ?? lead.qualificationResult?.qualification} />
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-400">{formatDate(lead.createdAt)}</td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            aria-label="View lead"
                            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
                            onClick={(event) => {
                              event.stopPropagation();
                              router.push(`/leads/${lead.id}`);
                            }}
                            type="button"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            aria-label="Edit lead"
                            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
                            onClick={(event) => {
                              event.stopPropagation();
                              router.push(`/leads/${lead.id}`);
                            }}
                            type="button"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            aria-label="Delete lead"
                            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-500/10 hover:text-red-300"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleDelete(lead.id);
                            }}
                            type="button"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                : null}
            </tbody>
          </table>
        </div>

        {!isLoading && leads.length === 0 ? (
          <div className="flex min-h-80 flex-col items-center justify-center px-6 py-12 text-center">
            <Users className="h-14 w-14 text-slate-600" />
            <h3 className="mt-4 text-lg font-semibold text-white">No leads found</h3>
            <p className="mt-2 text-sm text-slate-400">Add your first lead or connect a webhook source</p>
            <button
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500"
              onClick={() => setIsModalOpen(true)}
              type="button"
            >
              <Plus className="h-4 w-4" />
              Add Lead
            </button>
          </div>
        ) : null}
      </section>

      {total > limit ? (
        <div className="flex items-center justify-between">
          <button
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={page <= 1}
            onClick={() => setFilters({ page: page - 1 })}
            type="button"
          >
            Previous
          </button>
          <p className="text-sm text-slate-400">
            Page {page} of {totalPages}
          </p>
          <button
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={page >= totalPages}
            onClick={() => setFilters({ page: page + 1 })}
            type="button"
          >
            Next
          </button>
        </div>
      ) : null}

      <AddLeadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreate={async (data) => {
          await createLead(data);
          await fetchLeads(filters);
        }}
      />
    </div>
  );
}
