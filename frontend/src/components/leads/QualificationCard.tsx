"use client";

import { Clipboard, Sparkles } from "lucide-react";
import { useState } from "react";
import type { LeadQualification } from "@/types";
import { cn } from "@/lib/utils";

type QualificationWithAi = LeadQualification & {
  reasoning?: string | null;
  suggestedResponse?: string | null;
};

type QualificationCardProps = {
  qualification: QualificationWithAi | null;
  leadId: string;
  onQualify: () => void;
  isQualifying: boolean;
};

function scoreColor(score: number) {
  if (score >= 75) {
    return "text-green-300";
  }

  if (score >= 45) {
    return "text-yellow-300";
  }

  return "text-red-300";
}

function qualificationBadge(qualification?: string | null) {
  const normalized = qualification?.toLowerCase();
  const styles =
    normalized === "hot"
      ? "border-red-500/30 bg-red-500/20 text-red-300"
      : normalized === "warm"
        ? "border-orange-500/30 bg-orange-500/20 text-orange-300"
        : "border-blue-500/30 bg-blue-500/20 text-blue-300";

  return (
    <span className={cn("inline-flex rounded-full border px-3 py-1 text-sm font-medium", styles)}>
      {qualification ? `${qualification.charAt(0).toUpperCase()}${qualification.slice(1)}` : "Cold"}
    </span>
  );
}

function urgencyBadge(urgency?: string | null) {
  if (!urgency) {
    return <span className="text-sm text-slate-500">--</span>;
  }

  const normalized = urgency.toLowerCase();
  const styles =
    normalized === "high"
      ? "bg-red-500/15 text-red-300 ring-red-500/30"
      : normalized === "medium"
        ? "bg-yellow-500/15 text-yellow-300 ring-yellow-500/30"
        : "bg-green-500/15 text-green-300 ring-green-500/30";

  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset", styles)}>
      {urgency.charAt(0).toUpperCase() + urgency.slice(1)}
    </span>
  );
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <div className="mt-1 text-sm text-slate-200">{children}</div>
    </div>
  );
}

export default function QualificationCard({
  qualification,
  leadId: _leadId,
  onQualify,
  isQualifying
}: QualificationCardProps) {
  const [copied, setCopied] = useState(false);

  async function copyResponse() {
    if (!qualification?.suggestedResponse) {
      return;
    }

    await navigator.clipboard.writeText(qualification.suggestedResponse);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  if (!qualification) {
    return (
      <section className="rounded-xl border border-slate-800 bg-slate-900 p-6">
        <div className="flex flex-col items-center text-center">
          <Sparkles className="h-14 w-14 text-indigo-500/30" />
          <h3 className="mt-4 text-lg font-semibold text-white">Not yet qualified</h3>
          <p className="mt-2 text-sm text-slate-400">
            Run AI analysis to score this lead and get a suggested response
          </p>
          <button
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isQualifying}
            onClick={onQualify}
            type="button"
          >
            {isQualifying ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {isQualifying ? "Analyzing lead..." : "Run AI Qualification"}
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-indigo-500/30 bg-slate-900 p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-indigo-400" />
          <h3 className="text-lg font-semibold text-white">AI Qualification</h3>
        </div>
        <button
          className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-white disabled:opacity-60"
          disabled={isQualifying}
          onClick={onQualify}
          type="button"
        >
          {isQualifying ? "Running..." : "Re-run"}
        </button>
      </div>

      <div className="mt-6 text-center">
        <p className={cn("text-5xl font-bold", scoreColor(qualification.leadScore))}>
          {qualification.leadScore}
        </p>
        <p className="mt-1 text-sm text-slate-400">Lead Score</p>
        <div className="mt-3">{qualificationBadge(qualification.qualification)}</div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Detail label="Service">{qualification.service || "--"}</Detail>
        <Detail label="Urgency">{urgencyBadge(qualification.urgency)}</Detail>
        <Detail label="Budget">{qualification.budget || "--"}</Detail>
        <div className="sm:col-span-2">
          <Detail label="Intent">
            <span className="italic text-slate-300">{qualification.intent || "--"}</span>
          </Detail>
        </div>
      </div>

      <div className="mt-5 rounded-lg bg-slate-800 p-3">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">AI Reasoning</p>
        <p className="mt-2 text-sm italic text-slate-300">{qualification.reasoning || "--"}</p>
      </div>

      <div className="mt-4 rounded-lg border border-indigo-500/20 bg-indigo-950/50 p-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Suggested First Response
          </p>
          <button
            className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-indigo-200 transition-colors hover:bg-indigo-500/10"
            onClick={copyResponse}
            type="button"
          >
            <Clipboard className="h-3.5 w-3.5" />
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
        <p className="mt-2 text-sm text-white">{qualification.suggestedResponse || "--"}</p>
      </div>
    </section>
  );
}
