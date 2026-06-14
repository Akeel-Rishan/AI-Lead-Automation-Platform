"use client";

import { BookOpen, Send, X } from "lucide-react";
import { useState } from "react";
import type { KnowledgeAnswer, KnowledgeDoc } from "@/types";
import { cn } from "@/lib/utils";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  answer?: KnowledgeAnswer;
};

type AskKnowledgeModalProps = {
  doc: KnowledgeDoc | null;
  isOpen: boolean;
  isAsking: boolean;
  onClose: () => void;
  onAsk: (question: string, history?: Array<{ role: "user" | "assistant"; content: string }>) => Promise<KnowledgeAnswer>;
};

function confidenceBadge(confidence: KnowledgeAnswer["confidence"]) {
  const classes =
    confidence === "high"
      ? "bg-green-500/15 text-green-300 ring-green-500/30"
      : confidence === "medium"
        ? "bg-yellow-500/15 text-yellow-300 ring-yellow-500/30"
        : "bg-red-500/15 text-red-300 ring-red-500/30";
  const label =
    confidence === "high" ? "High Confidence" : confidence === "medium" ? "Medium" : "Low - limited info";

  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset", classes)}>
      {label}
    </span>
  );
}

export default function AskKnowledgeModal({
  doc,
  isOpen,
  isAsking,
  onClose,
  onAsk
}: AskKnowledgeModalProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !doc) {
    return null;
  }

  async function submitQuestion(event?: React.FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    const trimmedQuestion = question.trim();

    if (!trimmedQuestion) {
      return;
    }

    const history = messages.map((message) => ({
      role: message.role,
      content: message.content
    }));
    const userMessage: ChatMessage = {
      role: "user",
      content: trimmedQuestion
    };

    setMessages((currentMessages) => [...currentMessages, userMessage]);
    setQuestion("");
    setError(null);

    try {
      const answer = await onAsk(trimmedQuestion, history);
      setMessages((currentMessages) => [
        ...currentMessages,
        {
          role: "assistant",
          content: answer.answer,
          answer
        }
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to answer question");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6">
      <div className="flex max-h-[calc(100vh-3rem)] w-full max-w-2xl flex-col rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl shadow-black/40">
        <div className="flex items-center justify-between border-b border-slate-800 p-6">
          <div>
            <h2 className="text-lg font-semibold text-white">Test Knowledge Base</h2>
            <p className="mt-1 text-sm text-slate-400">{doc.name}</p>
          </div>
          <button
            aria-label="Close"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
            onClick={onClose}
            type="button"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-64 flex-1 space-y-4 overflow-y-auto p-6">
          {messages.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center text-center">
              <BookOpen className="h-12 w-12 text-slate-600" />
              <p className="mt-3 text-sm font-medium text-white">Ask a question to test retrieval.</p>
              <p className="mt-1 text-sm text-slate-400">The answer will use indexed knowledge chunks.</p>
            </div>
          ) : null}

          {messages.map((message, index) => (
            <div
              className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}
              key={`${message.role}-${index}`}
            >
              <div className={cn("max-w-[85%]", message.role === "assistant" && "flex gap-3")}>
                {message.role === "assistant" ? (
                  <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-800">
                    <BookOpen className="h-4 w-4 text-indigo-300" />
                  </div>
                ) : null}
                <div>
                  <div
                    className={cn(
                      "rounded-xl px-4 py-3 text-sm",
                      message.role === "user"
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-800 text-slate-100"
                    )}
                  >
                    {message.content}
                  </div>
                  {message.answer ? (
                    <div className="mt-3 space-y-2">
                      {confidenceBadge(message.answer.confidence)}
                      {message.answer.sources.map((source, sourceIndex) => (
                        <div
                          className="rounded-lg border border-slate-800 bg-slate-950 p-3"
                          key={`${source.docName}-${sourceIndex}`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <p className="truncate text-xs font-medium text-white">{source.docName}</p>
                            <p className="text-xs text-slate-500">{Math.round(source.similarity * 100)}%</p>
                          </div>
                          <p className="mt-2 text-xs text-slate-400">{source.chunkContent}</p>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          ))}

          {isAsking ? (
            <div className="flex justify-start">
              <div className="rounded-xl bg-slate-800 px-4 py-3">
                <div className="flex gap-1">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:120ms]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:240ms]" />
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {error ? <p className="px-6 pb-3 text-sm text-red-300">{error}</p> : null}

        <form className="flex gap-3 border-t border-slate-800 p-4" onSubmit={submitQuestion}>
          <input
            className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="Ask a question about your services..."
            value={question}
          />
          <button
            aria-label="Send question"
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isAsking}
            type="submit"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
