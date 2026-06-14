"use client";

import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useLeads, type LeadFormData } from "@/hooks/useLeads";
import { cn } from "@/lib/utils";

const sourceOptions = [
  { value: "website", label: "Website" },
  { value: "facebook", label: "Facebook" },
  { value: "google", label: "Google" },
  { value: "sms", label: "SMS" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "manual", label: "Manual" }
];

const urgencyOptions = [
  { value: "", label: "Select urgency" },
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" }
];

const initialForm: LeadFormData = {
  name: "",
  email: "",
  phone: "",
  source: "manual",
  service: "",
  urgency: "",
  budget: "",
  notes: ""
};

function inputClassName(extra?: string) {
  return cn(
    "w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none transition-colors placeholder:text-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500",
    extra
  );
}

export default function NewLeadPage() {
  const router = useRouter();
  const { createLead } = useLeads();
  const [form, setForm] = useState<LeadFormData>(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateField(field: keyof LeadFormData, value: string) {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const lead = await createLead(form);
      router.push(`/leads/${lead.id}`);
    } catch (err: any) {
      setError(err.response?.data?.error ?? "Unable to create lead");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-400 transition-colors hover:text-white"
        href="/leads"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Leads
      </Link>

      <section className="rounded-xl border border-slate-800 bg-slate-900 p-6">
        <header>
          <h2 className="text-2xl font-bold text-white">Add Lead</h2>
          <p className="mt-2 text-sm text-slate-400">Create a manual lead record for your team.</p>
        </header>

        {error ? (
          <div className="mt-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="text-sm font-medium text-slate-300" htmlFor="name">
              Full Name*
            </label>
            <input
              className={inputClassName("mt-2")}
              id="name"
              minLength={2}
              onChange={(event) => updateField("name", event.target.value)}
              required
              type="text"
              value={form.name}
            />
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-slate-300" htmlFor="email">
                Email
              </label>
              <input
                className={inputClassName("mt-2")}
                id="email"
                onChange={(event) => updateField("email", event.target.value)}
                type="email"
                value={form.email}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-300" htmlFor="phone">
                Phone
              </label>
              <input
                className={inputClassName("mt-2")}
                id="phone"
                onChange={(event) => updateField("phone", event.target.value)}
                type="tel"
                value={form.phone}
              />
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-slate-300" htmlFor="source">
                Lead Source*
              </label>
              <select
                className={inputClassName("mt-2")}
                id="source"
                onChange={(event) => updateField("source", event.target.value)}
                required
                value={form.source}
              >
                {sourceOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-300" htmlFor="urgency">
                Urgency
              </label>
              <select
                className={inputClassName("mt-2")}
                id="urgency"
                onChange={(event) => updateField("urgency", event.target.value)}
                value={form.urgency}
              >
                {urgencyOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-slate-300" htmlFor="service">
                Service Interested In
              </label>
              <input
                className={inputClassName("mt-2")}
                id="service"
                onChange={(event) => updateField("service", event.target.value)}
                type="text"
                value={form.service}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-300" htmlFor="budget">
                Budget
              </label>
              <input
                className={inputClassName("mt-2")}
                id="budget"
                onChange={(event) => updateField("budget", event.target.value)}
                placeholder="$5,000 - $10,000"
                type="text"
                value={form.budget}
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-300" htmlFor="notes">
              Notes
            </label>
            <textarea
              className={inputClassName("mt-2 min-h-32 resize-y")}
              id="notes"
              onChange={(event) => updateField("notes", event.target.value)}
              rows={4}
              value={form.notes}
            />
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-800 pt-5">
            <Link
              className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
              href="/leads"
            >
              Cancel
            </Link>
            <button
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSubmitting}
              type="submit"
            >
              <Save className="h-4 w-4" />
              {isSubmitting ? "Saving..." : "Create Lead"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
