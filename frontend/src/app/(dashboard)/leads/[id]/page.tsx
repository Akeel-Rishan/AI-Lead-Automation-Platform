"use client";

import {
  ArrowLeft,
  Calendar,
  Edit,
  Mail,
  MessageSquare,
  Phone,
  Save
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import LeadScoreBadge from "@/components/leads/LeadScoreBadge";
import LeadStatusBadge from "@/components/leads/LeadStatusBadge";
import QualificationCard from "@/components/leads/QualificationCard";
import { type LeadWithRelations } from "@/hooks/useLeads";
import { useToast } from "@/hooks/useToast";
import { api } from "@/lib/api";
import type { LeadQualification } from "@/types";

const statusOptions = ["new", "contacted", "qualified", "unqualified", "converted", "lost"];

function formatDateTime(date?: string | null) {
  if (!date) {
    return "--";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(date));
}

function sourceBadge(source?: string | null) {
  if (!source) {
    return null;
  }

  return <LeadStatusBadge status={source} />;
}

function Field({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-sm text-slate-200">{value || "--"}</p>
    </div>
  );
}

function parseQualification(qualification?: LeadQualification | null) {
  if (!qualification?.rawResponse) {
    return qualification ?? null;
  }

  try {
    const parsedQualification = {
      ...qualification,
      ...JSON.parse(qualification.rawResponse)
    } as LeadQualification;

    if (parsedQualification.reasoning === "OpenAI API key is not configured") {
      return {
        ...parsedQualification,
        reasoning:
          "This lead was qualified before Google Gemini was enabled. Re-run AI Qualification to score it with your Google API key."
      };
    }

    return parsedQualification;
  } catch {
    return qualification;
  }
}

export default function LeadDetailPage() {
  const params = useParams<{ id: string }>();
  const { showToast } = useToast();
  const [lead, setLead] = useState<LeadWithRelations | null>(null);
  const [qualification, setQualification] = useState<LeadQualification | null>(null);
  const [form, setForm] = useState<Partial<LeadWithRelations>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isQualifying, setIsQualifying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchLead() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await api.get<{ success: boolean; lead: LeadWithRelations }>(`/leads/${params.id}`);

        if (isMounted) {
          setLead(response.data.lead);
          setQualification(parseQualification(response.data.lead.qualificationResult));
          setForm(response.data.lead);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.response?.data?.error ?? "Unable to load lead");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchLead();

    return () => {
      isMounted = false;
    };
  }, [params.id]);

  useEffect(() => {
    let isMounted = true;

    async function fetchQualification() {
      try {
        const response = await api.get<{ success: boolean; qualification: LeadQualification }>(
          `/ai/qualification/${params.id}`
        );

        if (isMounted) {
          setQualification(response.data.qualification);
        }
      } catch (err: any) {
        if (err.response?.status !== 404 && isMounted) {
          showToast(err.response?.data?.error ?? "Unable to load qualification", "error");
        }
      }
    }

    fetchQualification();

    return () => {
      isMounted = false;
    };
  }, [params.id, showToast]);

  async function updateLead(data: Partial<LeadWithRelations>) {
    if (!lead) {
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const response = await api.put<{ success: boolean; lead: LeadWithRelations }>(`/leads/${lead.id}`, data);
      setLead((currentLead) => ({
        ...(currentLead ?? response.data.lead),
        ...response.data.lead
      }));
      setForm((currentForm) => ({
        ...currentForm,
        ...response.data.lead
      }));
      setIsEditing(false);
    } catch (err: any) {
      setError(err.response?.data?.error ?? "Unable to update lead");
    } finally {
      setIsSaving(false);
    }
  }

  function updateField(field: keyof LeadWithRelations, value: string) {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value
    }));
  }

  async function runQualification() {
    if (!lead) {
      return;
    }

    setIsQualifying(true);

    try {
      const response = await api.post<{ success: boolean; qualification: LeadQualification }>(
        `/ai/qualify/${lead.id}`
      );
      const nextQualification = response.data.qualification;
      setQualification(nextQualification);
      setLead((currentLead) =>
        currentLead
          ? {
              ...currentLead,
              leadScore: nextQualification.leadScore,
              qualification: nextQualification.qualification,
              service: nextQualification.service || currentLead.service,
              urgency: nextQualification.urgency,
              status: nextQualification.qualification === "hot" ? "qualified" : currentLead.status
            }
          : currentLead
      );
      showToast("Lead qualified successfully", "success");
    } catch (err: any) {
      showToast(err.response?.data?.error ?? "Unable to qualify lead", "error");
    } finally {
      setIsQualifying(false);
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div className="h-32 animate-pulse rounded-xl border border-slate-800 bg-slate-900" key={index} />
        ))}
      </div>
    );
  }

  if (error && !lead) {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-red-200">
        {error}
      </div>
    );
  }

  if (!lead) {
    return null;
  }

  return (
    <div className="space-y-6">
      <Link
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-400 transition-colors hover:text-white"
        href="/leads"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Leads
      </Link>

      {error ? (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,7fr)_minmax(280px,3fr)]">
        <div className="space-y-6">
          <section className="rounded-xl border border-slate-800 bg-slate-900 p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-2xl font-bold text-white">{lead.name}</h2>
                  <LeadScoreBadge
                    qualification={lead.qualification ?? qualification?.qualification}
                    score={lead.leadScore ?? qualification?.leadScore}
                  />
                  {sourceBadge(lead.source)}
                  <LeadStatusBadge status={lead.qualification ?? qualification?.qualification} />
                </div>
                <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-400">
                  {lead.email ? (
                    <span className="inline-flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      {lead.email}
                    </span>
                  ) : null}
                  {lead.phone ? (
                    <span className="inline-flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      {lead.phone}
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="flex gap-2">
                {isEditing ? (
                  <button
                    className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:opacity-60"
                    disabled={isSaving}
                    onClick={() =>
                      updateLead({
                        name: form.name,
                        email: form.email,
                        phone: form.phone,
                        service: form.service,
                        urgency: form.urgency,
                        budget: form.budget,
                        notes: form.notes
                      })
                    }
                    type="button"
                  >
                    <Save className="h-4 w-4" />
                    {isSaving ? "Saving..." : "Save"}
                  </button>
                ) : (
                  <button
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
                    onClick={() => setIsEditing(true)}
                    type="button"
                  >
                    <Edit className="h-4 w-4" />
                    Edit
                  </button>
                )}
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {isEditing ? (
                <>
                  <input
                    className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
                    onChange={(event) => updateField("name", event.target.value)}
                    value={form.name ?? ""}
                  />
                  <input
                    className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
                    onChange={(event) => updateField("email", event.target.value)}
                    placeholder="Email"
                    type="email"
                    value={form.email ?? ""}
                  />
                  <input
                    className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
                    onChange={(event) => updateField("phone", event.target.value)}
                    placeholder="Phone"
                    value={form.phone ?? ""}
                  />
                  <input
                    className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
                    onChange={(event) => updateField("service", event.target.value)}
                    placeholder="Service"
                    value={form.service ?? ""}
                  />
                  <select
                    className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
                    onChange={(event) => updateField("urgency", event.target.value)}
                    value={form.urgency ?? ""}
                  >
                    <option value="">Select urgency</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                  <input
                    className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
                    onChange={(event) => updateField("budget", event.target.value)}
                    placeholder="Budget"
                    value={form.budget ?? ""}
                  />
                  <textarea
                    className="min-h-28 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500 md:col-span-2"
                    onChange={(event) => updateField("notes", event.target.value)}
                    placeholder="Notes"
                    value={form.notes ?? ""}
                  />
                </>
              ) : (
                <>
                  <Field label="Email" value={lead.email} />
                  <Field label="Phone" value={lead.phone} />
                  <Field label="Service" value={lead.service} />
                  <Field label="Urgency" value={lead.urgency} />
                  <Field label="Budget" value={lead.budget} />
                  <Field label="Notes" value={lead.notes} />
                </>
              )}
            </div>

            <div className="mt-6 border-t border-slate-800 pt-5">
              <label className="text-sm font-medium text-slate-300" htmlFor="lead-status">
                Status
              </label>
              <select
                className="mt-2 w-full max-w-xs rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
                id="lead-status"
                onChange={(event) => updateLead({ status: event.target.value })}
                value={lead.status}
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </section>

          <section className="rounded-xl border border-slate-800 bg-slate-900 p-6">
            <h3 className="text-lg font-semibold text-white">Messages / Activity</h3>
            <div className="mt-5 space-y-3">
              {lead.messages?.length ? (
                lead.messages.map((message) => (
                  <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-4" key={message.id}>
                    <div className="flex items-center justify-between gap-3">
                      <span className="inline-flex items-center gap-2 text-sm font-medium capitalize text-slate-200">
                        <MessageSquare className="h-4 w-4 text-blue-400" />
                        {message.channel} - {message.direction}
                      </span>
                      <span className="text-xs text-slate-500">{formatDateTime(message.sentAt)}</span>
                    </div>
                    <p className="mt-3 text-sm text-slate-300">{message.content}</p>
                  </div>
                ))
              ) : (
                <p className="rounded-lg border border-dashed border-slate-700 bg-slate-950/40 px-4 py-8 text-center text-sm text-slate-400">
                  No messages yet.
                </p>
              )}
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <QualificationCard
            isQualifying={isQualifying}
            leadId={lead.id}
            onQualify={runQualification}
            qualification={qualification}
          />

          <section className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <h3 className="font-semibold text-white">Quick Info</h3>
            <div className="mt-4 space-y-4">
              <Field label="Created" value={formatDateTime(lead.createdAt)} />
              <Field label="Last Updated" value={formatDateTime(lead.updatedAt)} />
              <Field label="Source" value={lead.source} />
              <Field label="Assigned To" value={lead.assignedTo} />
            </div>
          </section>

          <section className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <h3 className="font-semibold text-white">Appointments</h3>
            <div className="mt-4 space-y-3">
              {lead.appointments?.length ? (
                lead.appointments.map((appointment) => (
                  <div className="rounded-lg bg-slate-950/60 p-3" key={appointment.id}>
                    <p className="text-sm font-medium text-white">{appointment.title}</p>
                    <p className="mt-1 text-xs text-slate-400">{formatDateTime(appointment.scheduledAt)}</p>
                    <div className="mt-2">
                      <LeadStatusBadge status={appointment.status} />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-400">No appointments scheduled.</p>
              )}
            </div>
          </section>

          <section className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <h3 className="font-semibold text-white">Follow-ups</h3>
            <div className="mt-4 space-y-3">
              {lead.followUps?.length ? (
                lead.followUps.map((followUp) => (
                  <div className="rounded-lg bg-slate-950/60 p-3" key={followUp.id}>
                    <p className="text-sm text-slate-200">{followUp.content}</p>
                    <p className="mt-1 text-xs text-slate-400">{formatDateTime(followUp.scheduledAt)}</p>
                    <div className="mt-2">
                      <LeadStatusBadge status={followUp.status} />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-400">No follow-ups scheduled.</p>
              )}
            </div>
          </section>

          <section className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <h3 className="font-semibold text-white">Quick Actions</h3>
            <div className="mt-4 space-y-3">
              <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-500" type="button">
                <Calendar className="h-4 w-4" />
                Schedule Appointment
              </button>
              <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500" type="button">
                <MessageSquare className="h-4 w-4" />
                Send Message
              </button>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
