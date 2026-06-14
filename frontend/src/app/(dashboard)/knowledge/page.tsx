"use client";

import {
  BookOpen,
  DollarSign,
  File,
  FileText,
  HelpCircle,
  Plus,
  Shield,
  Trash2,
  Upload
} from "lucide-react";
import { useMemo, useState } from "react";
import AskKnowledgeModal from "@/components/knowledge/AskKnowledgeModal";
import UploadDocumentModal from "@/components/knowledge/UploadDocumentModal";
import { useKnowledge } from "@/hooks/useKnowledge";
import { useToast } from "@/hooks/useToast";
import { cn } from "@/lib/utils";
import type { KnowledgeDoc } from "@/types";

const typeStyles: Record<string, { icon: typeof File; color: string; bg: string }> = {
  pdf: { icon: FileText, color: "text-red-300", bg: "bg-red-500/10" },
  docx: { icon: FileText, color: "text-blue-300", bg: "bg-blue-500/10" },
  faq: { icon: HelpCircle, color: "text-yellow-300", bg: "bg-yellow-500/10" },
  pricing: { icon: DollarSign, color: "text-green-300", bg: "bg-green-500/10" },
  policy: { icon: Shield, color: "text-purple-300", bg: "bg-purple-500/10" },
  txt: { icon: File, color: "text-slate-300", bg: "bg-slate-700/50" },
  general: { icon: File, color: "text-slate-300", bg: "bg-slate-700/50" },
  product: { icon: FileText, color: "text-indigo-300", bg: "bg-indigo-500/10" }
};

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(date));
}

function typeLabel(type: string) {
  if (type === "docx") {
    return "DOCX";
  }

  if (type === "pdf") {
    return "PDF";
  }

  return type.charAt(0).toUpperCase() + type.slice(1);
}

function DocumentCard({
  doc,
  onTest,
  onDelete
}: {
  doc: KnowledgeDoc;
  onTest: () => void;
  onDelete: () => void;
}) {
  const style = typeStyles[doc.type] ?? typeStyles.general;
  const Icon = style.icon;
  const chunkCount = doc._count?.chunks ?? 0;

  return (
    <article className="rounded-xl border border-slate-800 bg-slate-900 p-5">
      <div className="flex items-start gap-3">
        <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-lg", style.bg)}>
          <Icon className={cn("h-5 w-5", style.color)} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold text-white">{doc.name}</h3>
          <div className="mt-2">
            <span className="inline-flex rounded-full bg-slate-800 px-2.5 py-0.5 text-xs font-medium text-slate-300">
              {typeLabel(doc.type)}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-5 space-y-2">
        <p className="text-sm text-slate-400">
          {chunkCount > 0 ? `${chunkCount} chunks indexed` : "Processing..."}
        </p>
        <p className="text-xs text-slate-500">{formatDate(doc.createdAt)}</p>
      </div>

      <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-800 pt-4">
        <button
          className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
          onClick={onTest}
          type="button"
        >
          Test
        </button>
        <button
          aria-label="Delete document"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-500/10 hover:text-red-300"
          onClick={onDelete}
          type="button"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </article>
  );
}

export default function KnowledgePage() {
  const {
    docs,
    isLoading,
    isUploading,
    isAsking,
    uploadFile,
    addText,
    deleteDoc,
    askQuestion,
    fetchDocs
  } = useKnowledge();
  const { showToast } = useToast();
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [testingDoc, setTestingDoc] = useState<KnowledgeDoc | null>(null);

  const totalChunks = useMemo(
    () => docs.reduce((total, doc) => total + (doc._count?.chunks ?? 0), 0),
    [docs]
  );

  async function handleDelete(doc: KnowledgeDoc) {
    const confirmed = window.confirm(`Delete "${doc.name}"?`);

    if (!confirmed) {
      return;
    }

    try {
      await deleteDoc(doc.id);
      showToast("Document deleted", "success");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Unable to delete document", "error");
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Knowledge Base</h2>
          <p className="mt-1 text-sm text-slate-400">Manage company-specific knowledge for AI answers.</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
            onClick={() => setIsUploadOpen(true)}
            type="button"
          >
            <Plus className="h-4 w-4" />
            Add Text
          </button>
          <button
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500"
            onClick={() => setIsUploadOpen(true)}
            type="button"
          >
            <Upload className="h-4 w-4" />
            Upload Document
          </button>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <p className="text-sm text-slate-400">Total Documents</p>
          <p className="mt-3 text-3xl font-bold text-white">{isLoading ? "--" : docs.length}</p>
        </article>
        <article className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <p className="text-sm text-slate-400">Knowledge Chunks</p>
          <p className="mt-3 text-3xl font-bold text-white">{isLoading ? "--" : totalChunks}</p>
        </article>
        <article className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <p className="text-sm text-slate-400">Status</p>
          <p className={cn("mt-3 text-3xl font-bold", docs.length > 0 ? "text-green-300" : "text-slate-500")}>
            {docs.length > 0 ? "Ready" : "Empty"}
          </p>
        </article>
      </section>

      {isLoading ? (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div className="h-52 animate-pulse rounded-xl border border-slate-800 bg-slate-900" key={index} />
          ))}
        </section>
      ) : null}

      {!isLoading && docs.length > 0 ? (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {docs.map((doc) => (
            <DocumentCard
              doc={doc}
              key={doc.id}
              onDelete={() => handleDelete(doc)}
              onTest={() => setTestingDoc(doc)}
            />
          ))}
        </section>
      ) : null}

      {!isLoading && docs.length === 0 ? (
        <section className="flex min-h-96 flex-col items-center justify-center rounded-xl border border-dashed border-slate-700 bg-slate-900 px-6 text-center">
          <BookOpen className="h-16 w-16 text-slate-600" />
          <h3 className="mt-5 text-lg font-semibold text-white">No documents yet</h3>
          <p className="mt-2 max-w-md text-sm text-slate-400">
            Upload your first document to enable AI-powered customer support
          </p>
          <button
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500"
            onClick={() => setIsUploadOpen(true)}
            type="button"
          >
            <Upload className="h-4 w-4" />
            Upload Document
          </button>
        </section>
      ) : null}

      <UploadDocumentModal
        isOpen={isUploadOpen}
        isUploading={isUploading}
        onAddText={async (data) => {
          await addText(data);
          showToast("Document added and indexing started", "success");
          window.setTimeout(fetchDocs, 2500);
        }}
        onClose={() => setIsUploadOpen(false)}
        onUploadFile={async (formData) => {
          await uploadFile(formData);
          showToast("Document added and indexing started", "success");
          window.setTimeout(fetchDocs, 2500);
        }}
      />

      <AskKnowledgeModal
        doc={testingDoc}
        isAsking={isAsking}
        isOpen={Boolean(testingDoc)}
        onAsk={askQuestion}
        onClose={() => setTestingDoc(null)}
      />
    </div>
  );
}
