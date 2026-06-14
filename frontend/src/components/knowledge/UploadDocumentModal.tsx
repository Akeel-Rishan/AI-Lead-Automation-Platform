"use client";

import { File, FileText, Upload, X } from "lucide-react";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

type UploadDocumentModalProps = {
  isOpen: boolean;
  isUploading: boolean;
  onClose: () => void;
  onUploadFile: (formData: FormData) => Promise<void>;
  onAddText: (data: { name: string; type: string; content: string }) => Promise<void>;
};

const typeOptions = [
  { value: "faq", label: "FAQ" },
  { value: "pricing", label: "Pricing" },
  { value: "policy", label: "Policy" },
  { value: "product", label: "Product Info" },
  { value: "general", label: "General" }
];

function inputClassName(extra?: string) {
  return cn(
    "w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none transition-colors placeholder:text-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500",
    extra
  );
}

function filenameWithoutExtension(name: string) {
  return name.replace(/\.[^/.]+$/, "");
}

function formatSize(size: number) {
  if (size < 1024 * 1024) {
    return `${Math.round(size / 1024)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export default function UploadDocumentModal({
  isOpen,
  isUploading,
  onClose,
  onUploadFile,
  onAddText
}: UploadDocumentModalProps) {
  const [activeTab, setActiveTab] = useState<"file" | "text">("file");
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");
  const [fileType, setFileType] = useState("general");
  const [textName, setTextName] = useState("");
  const [textType, setTextType] = useState("general");
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);

  const selectedFileType = useMemo(() => {
    if (!file) {
      return null;
    }

    if (file.type === "application/pdf") {
      return "pdf";
    }

    if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      return "docx";
    }

    if (file.name.toLowerCase().endsWith(".md")) {
      return "general";
    }

    return fileType;
  }, [file, fileType]);

  if (!isOpen) {
    return null;
  }

  function resetAndClose() {
    setError(null);
    onClose();
  }

  function handleFileSelect(nextFile: File | null) {
    if (!nextFile) {
      return;
    }

    if (nextFile.size > 10 * 1024 * 1024) {
      setError("File must be 10MB or smaller");
      return;
    }

    setFile(nextFile);
    setFileName(filenameWithoutExtension(nextFile.name));
    setError(null);
  }

  async function submitFile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!file) {
      setError("Choose a file to upload");
      return;
    }

    try {
      const formData = new FormData();
      formData.set("file", file);
      formData.set("name", fileName || filenameWithoutExtension(file.name));
      formData.set("type", selectedFileType ?? fileType);
      await onUploadFile(formData);
      resetAndClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    }
  }

  async function submitText(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      await onAddText({
        name: textName,
        type: textType,
        content
      });
      resetAndClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save text");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6">
      <div className="max-h-[calc(100vh-3rem)] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl shadow-black/40">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Add Knowledge</h2>
          <button
            aria-label="Close"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
            onClick={resetAndClose}
            type="button"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 grid grid-cols-2 rounded-lg bg-slate-950 p-1">
          <button
            className={cn(
              "rounded-md px-3 py-2 text-sm font-medium transition-colors",
              activeTab === "file" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-white"
            )}
            onClick={() => setActiveTab("file")}
            type="button"
          >
            Upload File
          </button>
          <button
            className={cn(
              "rounded-md px-3 py-2 text-sm font-medium transition-colors",
              activeTab === "text" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-white"
            )}
            onClick={() => setActiveTab("text")}
            type="button"
          >
            Add Text
          </button>
        </div>

        {error ? (
          <div className="mt-5 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        {activeTab === "file" ? (
          <form className="mt-6 space-y-4" onSubmit={submitFile}>
            <label
              className="block cursor-pointer rounded-xl border border-dashed border-slate-700 p-10 text-center transition-colors hover:border-indigo-500/60 hover:bg-slate-950/60"
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                handleFileSelect(event.dataTransfer.files[0] ?? null);
              }}
            >
              <input
                accept=".pdf,.docx,.txt,.md,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown"
                className="hidden"
                onChange={(event) => handleFileSelect(event.target.files?.[0] ?? null)}
                type="file"
              />
              <Upload className="mx-auto h-12 w-12 text-slate-500" />
              <p className="mt-4 text-sm font-medium text-white">Drag & drop your file here</p>
              <p className="mt-1 text-sm text-indigo-400">or click to browse</p>
              <p className="mt-3 text-xs text-slate-500">PDF, DOCX, TXT, MD - max 10MB</p>
            </label>

            {file ? (
              <div className="flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-950 p-3">
                <FileText className="h-5 w-5 text-indigo-300" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">{file.name}</p>
                  <p className="text-xs text-slate-500">{formatSize(file.size)}</p>
                </div>
              </div>
            ) : null}

            <div>
              <label className="text-sm font-medium text-slate-300" htmlFor="file-name">
                Name
              </label>
              <input
                className={inputClassName("mt-2")}
                id="file-name"
                onChange={(event) => setFileName(event.target.value)}
                required
                value={fileName}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-300" htmlFor="file-type">
                Type
              </label>
              <select
                className={inputClassName("mt-2")}
                id="file-type"
                onChange={(event) => setFileType(event.target.value)}
                value={fileType}
              >
                {typeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isUploading}
              type="submit"
            >
              {isUploading ? "Uploading..." : "Upload Document"}
            </button>
          </form>
        ) : (
          <form className="mt-6 space-y-4" onSubmit={submitText}>
            <div>
              <label className="text-sm font-medium text-slate-300" htmlFor="text-name">
                Name
              </label>
              <input
                className={inputClassName("mt-2")}
                id="text-name"
                onChange={(event) => setTextName(event.target.value)}
                required
                value={textName}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-300" htmlFor="text-type">
                Type
              </label>
              <select
                className={inputClassName("mt-2")}
                id="text-type"
                onChange={(event) => setTextType(event.target.value)}
                value={textType}
              >
                {typeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-300" htmlFor="knowledge-content">
                Content
              </label>
              <textarea
                className={inputClassName("mt-2 min-h-48 resize-y")}
                id="knowledge-content"
                minLength={50}
                onChange={(event) => setContent(event.target.value)}
                placeholder="Paste your FAQ content, pricing details, policies..."
                required
                value={content}
              />
              <p className="mt-2 text-xs text-slate-500">{content.length} characters</p>
            </div>

            <button
              className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isUploading}
              type="submit"
            >
              {isUploading ? "Saving..." : "Save to Knowledge Base"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
