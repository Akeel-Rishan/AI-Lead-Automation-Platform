"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import type { KnowledgeAnswer, KnowledgeDoc } from "@/types";

type DocsResponse = {
  success: boolean;
  docs: KnowledgeDoc[];
  error?: string;
};

type AskHistory = Array<{
  role: "user" | "assistant" | "inbound" | "outbound";
  content: string;
}>;

export function useKnowledge() {
  const [docs, setDocs] = useState<KnowledgeDoc[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isAsking, setIsAsking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDocs = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.get<DocsResponse>("/knowledge");
      setDocs(response.data.docs);
    } catch (err: any) {
      setError(err.response?.data?.error ?? "Unable to load knowledge documents");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const uploadFile = useCallback(
    async (formData: FormData) => {
      setIsUploading(true);
      setError(null);

      try {
        await api.post("/knowledge/upload", formData, {
          headers: {
            "Content-Type": "multipart/form-data"
          }
        });
        await fetchDocs();
      } catch (err: any) {
        const message = err.response?.data?.error ?? "Unable to upload document";
        setError(message);
        throw new Error(message);
      } finally {
        setIsUploading(false);
      }
    },
    [fetchDocs]
  );

  const addText = useCallback(
    async (data: { name: string; type: string; content: string }) => {
      setIsUploading(true);
      setError(null);

      try {
        await api.post("/knowledge/text", data);
        await fetchDocs();
      } catch (err: any) {
        const message = err.response?.data?.error ?? "Unable to add text";
        setError(message);
        throw new Error(message);
      } finally {
        setIsUploading(false);
      }
    },
    [fetchDocs]
  );

  const deleteDoc = useCallback(
    async (id: string) => {
      setError(null);

      try {
        await api.delete(`/knowledge/${id}`);
        await fetchDocs();
      } catch (err: any) {
        const message = err.response?.data?.error ?? "Unable to delete document";
        setError(message);
        throw new Error(message);
      }
    },
    [fetchDocs]
  );

  const askQuestion = useCallback(async (question: string, history?: AskHistory) => {
    setIsAsking(true);
    setError(null);

    try {
      const response = await api.post<{ success: boolean } & KnowledgeAnswer>("/knowledge/ask", {
        question,
        conversationHistory: history
      });
      return {
        answer: response.data.answer,
        sources: response.data.sources,
        confidence: response.data.confidence,
        hadRelevantDocs: response.data.hadRelevantDocs
      };
    } catch (err: any) {
      const message = err.response?.data?.error ?? "Unable to answer question";
      setError(message);
      throw new Error(message);
    } finally {
      setIsAsking(false);
    }
  }, []);

  useEffect(() => {
    fetchDocs();
  }, [fetchDocs]);

  return useMemo(
    () => ({
      docs,
      isLoading,
      isUploading,
      isAsking,
      error,
      fetchDocs,
      uploadFile,
      addText,
      deleteDoc,
      askQuestion
    }),
    [docs, isLoading, isUploading, isAsking, error, fetchDocs, uploadFile, addText, deleteDoc, askQuestion]
  );
}
