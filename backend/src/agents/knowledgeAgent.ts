import type { Message } from "@prisma/client";
import { generateGeminiEmbedding, generateGeminiText } from "../lib/googleAI";
import { prisma } from "../lib/prisma";
import { saveEmbedding, searchSimilarChunks } from "../lib/vectorDb";

export type KnowledgeAnswer = {
  answer: string;
  sources: Array<{
    docName: string;
    chunkContent: string;
    similarity: number;
  }>;
  confidence: "high" | "medium" | "low";
  hadRelevantDocs: boolean;
};

function delay(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function generateEmbedding(text: string): Promise<number[]> {
  return generateGeminiEmbedding(text.slice(0, 8000));
}

export async function embedAndStoreChunks(
  docId: string,
  tenantId: string,
  chunks: string[]
): Promise<void> {
  for (let index = 0; index < chunks.length; index += 1) {
    const chunk = await prisma.docChunk.create({
      data: {
        docId,
        tenantId,
        chunkIndex: index,
        content: chunks[index]
      }
    });
    const embedding = await generateEmbedding(chunks[index]);
    await saveEmbedding(chunk.id, embedding);
    console.log(`[KnowledgeAgent] Embedded chunk ${index + 1}/${chunks.length} for doc ${docId}`);
    await delay(100);
  }
}

function confidenceForSimilarity(similarity: number): "high" | "medium" | "low" {
  if (similarity >= 0.75) {
    return "high";
  }

  if (similarity >= 0.5) {
    return "medium";
  }

  return "low";
}

function historyToText(conversationHistory: Message[] = []) {
  return conversationHistory
    .slice(-4)
    .map((message) => `${message.direction === "outbound" ? "Assistant" : "Customer"}: ${message.content}`)
    .join("\n");
}

export async function answerQuestion(
  tenantId: string,
  question: string,
  conversationHistory: Message[] = []
): Promise<KnowledgeAnswer> {
  const embedding = await generateEmbedding(question);
  const chunks = await searchSimilarChunks(tenantId, embedding, 5);
  const topSimilarity = chunks[0]?.similarity ?? 0;

  if (chunks.length === 0 || topSimilarity < 0.3) {
    return {
      answer:
        "I don't have specific information about that in my knowledge base. Please contact us directly for assistance.",
      sources: [],
      confidence: "low",
      hadRelevantDocs: false
    };
  }

  const docIds = [...new Set(chunks.map((chunk) => chunk.docId))];
  const docs = await prisma.knowledgeDoc.findMany({
    where: {
      id: { in: docIds },
      tenantId
    },
    select: {
      id: true,
      name: true
    }
  });
  const docNames = new Map(docs.map((doc) => [doc.id, doc.name]));
  const context = chunks
    .map((chunk) => {
      const docName = docNames.get(chunk.docId) ?? "Knowledge document";
      return `Source: ${docName}\n${chunk.content}`;
    })
    .join("\n\n---\n\n");
  const systemPrompt = `You are a helpful customer service AI assistant. Answer the customer's question using ONLY the provided context from the company's knowledge base.

Rules:
- Answer based strictly on the provided context
- If the context doesn't fully answer the question, say so honestly
- Be friendly, professional, and concise
- Do not make up information not in the context
- If pricing is mentioned, be accurate to what's in the context`;
  const historyText = historyToText(conversationHistory);
  const userPrompt = `Knowledge Base Context:
${context}

${historyText ? `Conversation History:\n${historyText}\n\n` : ""}Customer Question:
${question}`;
  const answer = await generateGeminiText({
    systemPrompt,
    userPrompt,
    temperature: 0.4,
    maxOutputTokens: 1024
  });

  return {
    answer,
    sources: chunks.map((chunk) => ({
      docName: docNames.get(chunk.docId) ?? "Knowledge document",
      chunkContent:
        chunk.content.length > 150 ? `${chunk.content.slice(0, 150).trim()}...` : chunk.content,
      similarity: chunk.similarity
    })),
    confidence: confidenceForSimilarity(topSimilarity),
    hadRelevantDocs: true
  };
}
