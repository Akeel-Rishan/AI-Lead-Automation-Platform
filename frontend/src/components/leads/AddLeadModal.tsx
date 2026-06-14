"use client";

import { X } from "lucide-react";
import { useState } from "react";
import type { LeadFormData } from "@/hooks/useLeads";
import { cn } from "@/lib/utils";

type AddLeadModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: LeadFormData) => Promise<void>;
};

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

export default function AddLeadModal({ isOpen, onClose, onCreate }: AddLeadModalProps) {
  const [form, setForm] = useState<LeadFormData>(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) {
    return null;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await onCreate(form);
      setForm(initialForm);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error ?? "Unable to add lead");
    } finally {
      setIsSubmitting(false);
    }
  }

  function updateField(field: keyof LeadFormData, value: string) {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value
    }));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6">
      <div className="max-h-[calc(100vh-3rem)] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl shadow-black/40">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Add Lead</h2>
          <button
            aria-label="Close"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
            onClick={onClose}
            type="button"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error ? (
          <div className="mt-5 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="text-sm font-medium text-slate-300" htmlFor="modal-name">
              Full Name*
            </label>
            <input
              className={inputClassName("mt-2")}
              id="modal-name"
              minLength={2}
              onChange={(event) => updateField("name", event.target.value)}
              required
              type="text"
              value={form.name}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-slate-300" htmlFor="modal-email">
                Email
              </label>
              <input
                className={inputClassName("mt-2")}
                id="modal-email"
                onChange={(event) => updateField("email", event.target.value)}
                type="email"
                value={form.email}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-300" htmlFor="modal-phone">
                Phone
              </label>
              <input
                className={inputClassName("mt-2")}
                id="modal-phone"
                onChange={(event) => updateField("phone", event.target.value)}
                type="tel"
                value={form.phone}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-slate-300" htmlFor="modal-source">
                Lead Source*
              </label>
              <select
                className={inputClassName("mt-2")}
                id="modal-source"
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
              <label className="text-sm font-medium text-slate-300" htmlFor="modal-urgency">
                Urgency
              </label>
              <select
                className={inputClassName("mt-2")}
                id="modal-urgency"
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

          <div>
            <label className="text-sm font-medium text-slate-300" htmlFor="modal-service">
              Service Interested In
            </label>
            <input
              className={inputClassName("mt-2")}
              id="modal-service"
              onChange={(event) => updateField("service", event.target.value)}
              type="text"
              value={form.service}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-300" htmlFor="modal-budget">
              Budget
            </label>
            <input
              className={inputClassName("mt-2")}
              id="modal-budget"
              onChange={(event) => updateField("budget", event.target.value)}
              placeholder="$5,000 - $10,000"
              type="text"
              value={form.budget}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-300" htmlFor="modal-notes">
              Notes
            </label>
            <textarea
              className={inputClassName("mt-2 min-h-28 resize-y")}
              id="modal-notes"
              onChange={(event) => updateField("notes", event.target.value)}
              rows={4}
              value={form.notes}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
              onClick={onClose}
              type="button"
            >
              Cancel
            </button>
            <button
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? "Adding..." : "Add Lead"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
