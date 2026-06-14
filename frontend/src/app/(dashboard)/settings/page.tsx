"use client";

import { Check, Copy, KeyRound, Plus, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

type ApiKey = {
  id: string;
  name: string;
  lastUsed?: string | null;
  isActive: boolean;
  createdAt: string;
};

type CreatedApiKey = {
  id: string;
  name: string;
  key: string;
};

function formatDate(date?: string | null) {
  if (!date) {
    return "Never";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(date));
}

function apiBaseUrl() {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
}

export default function SettingsPage() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [createdKey, setCreatedKey] = useState<CreatedApiKey | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchApiKeys() {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.get<{ success: boolean; apiKeys: ApiKey[] }>("/api-keys");
      setApiKeys(response.data.apiKeys);
    } catch (err: any) {
      setError(err.response?.data?.error ?? "Unable to load API keys");
    } finally {
      setIsLoading(false);
    }
  }

  async function createApiKey(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    try {
      const response = await api.post<{ success: boolean; id: string; name: string; key: string }>("/api-keys", {
        name: newKeyName
      });
      setCreatedKey({
        id: response.data.id,
        name: response.data.name,
        key: response.data.key
      });
      setNewKeyName("");
      setIsCreateOpen(false);
      await fetchApiKeys();
    } catch (err: any) {
      setError(err.response?.data?.error ?? "Unable to create API key");
    }
  }

  async function deactivateApiKey(id: string) {
    const confirmed = window.confirm("Deactivate this API key?");

    if (!confirmed) {
      return;
    }

    try {
      await api.delete(`/api-keys/${id}`);
      await fetchApiKeys();
    } catch (err: any) {
      setError(err.response?.data?.error ?? "Unable to deactivate API key");
    }
  }

  async function copyKey() {
    if (!createdKey) {
      return;
    }

    await navigator.clipboard.writeText(createdKey.key);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  useEffect(() => {
    fetchApiKeys();
  }, []);

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-bold text-white">Settings</h2>
      </header>

      {error ? (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <section className="rounded-xl border border-slate-800 bg-slate-900 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-indigo-400" />
              <h3 className="text-lg font-semibold text-white">Webhook API Keys</h3>
            </div>
            <p className="mt-2 max-w-2xl text-sm text-slate-400">
              Use these keys to authenticate webhook requests from external lead sources.
            </p>
          </div>
          <button
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500"
            onClick={() => setIsCreateOpen(true)}
            type="button"
          >
            <Plus className="h-4 w-4" />
            Create API Key
          </button>
        </div>

        <div className="mt-6 overflow-hidden rounded-xl border border-slate-800">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-800">
              <thead className="bg-slate-950/40">
                <tr>
                  {["Name", "Created", "Last Used", "Status", "Actions"].map((heading) => (
                    <th
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400"
                      key={heading}
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {isLoading
                  ? Array.from({ length: 3 }).map((_, index) => (
                      <tr key={index}>
                        {Array.from({ length: 5 }).map((__, cellIndex) => (
                          <td className="px-4 py-4" key={cellIndex}>
                            <div className="h-4 animate-pulse rounded bg-slate-800" />
                          </td>
                        ))}
                      </tr>
                    ))
                  : null}
                {!isLoading && apiKeys.length > 0
                  ? apiKeys.map((apiKey) => (
                      <tr key={apiKey.id}>
                        <td className="px-4 py-4 text-sm font-medium text-white">{apiKey.name}</td>
                        <td className="px-4 py-4 text-sm text-slate-400">{formatDate(apiKey.createdAt)}</td>
                        <td className="px-4 py-4 text-sm text-slate-400">{formatDate(apiKey.lastUsed)}</td>
                        <td className="px-4 py-4">
                          <span className="inline-flex rounded-full bg-green-500/15 px-2.5 py-0.5 text-xs font-medium text-green-300 ring-1 ring-inset ring-green-500/30">
                            {apiKey.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <button
                            aria-label="Deactivate API key"
                            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-500/10 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
                            disabled={!apiKey.isActive}
                            onClick={() => deactivateApiKey(apiKey.id)}
                            type="button"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  : null}
              </tbody>
            </table>
          </div>
          {!isLoading && apiKeys.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <KeyRound className="mx-auto h-10 w-10 text-slate-600" />
              <p className="mt-3 text-sm font-medium text-white">No API keys yet.</p>
              <p className="mt-1 text-sm text-slate-400">Create a key to start receiving webhook leads.</p>
            </div>
          ) : null}
        </div>
      </section>

      {isCreateOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl shadow-black/40">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Create API Key</h3>
              <button
                aria-label="Close"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
                onClick={() => setIsCreateOpen(false)}
                type="button"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form className="mt-6 space-y-4" onSubmit={createApiKey}>
              <div>
                <label className="text-sm font-medium text-slate-300" htmlFor="api-key-name">
                  Name
                </label>
                <input
                  className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  id="api-key-name"
                  minLength={2}
                  onChange={(event) => setNewKeyName(event.target.value)}
                  required
                  type="text"
                  value={newKeyName}
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
                  onClick={() => setIsCreateOpen(false)}
                  type="button"
                >
                  Cancel
                </button>
                <button
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500"
                  type="submit"
                >
                  Create API Key
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {createdKey ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl shadow-black/40">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">API Key Created</h3>
              <button
                aria-label="Close"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
                onClick={() => setCreatedKey(null)}
                type="button"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-5 rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-100">
              Copy this key now. You won't be able to see it again.
            </div>
            <div className="mt-4 rounded-lg bg-slate-800 p-3 font-mono text-sm text-slate-100">
              {createdKey.key}
            </div>
            <button
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500"
              onClick={copyKey}
              type="button"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied" : "Copy to Clipboard"}
            </button>

            <div className="mt-6">
              <h4 className="text-sm font-semibold text-white">Webhook URLs</h4>
              <div className="mt-3 space-y-2">
                {["website", "facebook", "google", "sms"].map((source) => (
                  <div className="rounded-lg bg-slate-950 px-3 py-2 font-mono text-xs text-slate-300" key={source}>
                    POST {apiBaseUrl()}/webhooks/{source}?apiKey={createdKey.key}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
