import fs from "fs";
import { chunkText } from "../lib/chunker";
import { extractText } from "../lib/textExtractor";
import { deleteChunkEmbeddings } from "../lib/vectorDb";
import { prisma } from "../lib/prisma";
import { embedAndStoreChunks } from "../agents/knowledgeAgent";
import { AppError } from "../middleware/errorHandler";

function mimeTypeForDoc(type: string) {
  if (type === "pdf") {
    return "application/pdf";
  }

  if (type === "docx") {
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }

  if (type === "md") {
    return "text/markdown";
  }

  return "text/plain";
}

export async function processDocument(docId: string, tenantId: string): Promise<void> {
  const doc = await prisma.knowledgeDoc.findFirst({
    where: {
      id: docId,
      tenantId
    }
  });

  if (!doc) {
    throw new AppError("Document not found", 404);
  }

  const extractedText =
    doc.fileUrl && fs.existsSync(doc.fileUrl)
      ? await extractText(doc.fileUrl, mimeTypeForDoc(doc.type))
      : doc.content;
  const content = extractedText.trim();

  if (!content) {
    await prisma.knowledgeDoc.update({
      where: { id: doc.id },
      data: { isActive: false }
    });
    return;
  }

  const chunks = chunkText(content);
  await deleteChunkEmbeddings(doc.id);

  if (chunks.length === 0) {
    await prisma.knowledgeDoc.update({
      where: { id: doc.id },
      data: {
        content,
        isActive: false
      }
    });
    return;
  }

  await embedAndStoreChunks(doc.id, tenantId, chunks);
  await prisma.knowledgeDoc.update({
    where: { id: doc.id },
    data: {
      content,
      isActive: true,
      updatedAt: new Date()
    }
  });
  console.log(`[KnowledgeService] Processed doc ${docId}: ${chunks.length} chunks`);
}

export async function deleteDocument(docId: string, tenantId: string): Promise<void> {
  const doc = await prisma.knowledgeDoc.findFirst({
    where: {
      id: docId,
      tenantId
    },
    select: {
      id: true,
      fileUrl: true
    }
  });

  if (!doc) {
    throw new AppError("Document not found", 404);
  }

  await prisma.docChunk.deleteMany({
    where: { docId: doc.id }
  });
  await prisma.knowledgeDoc.delete({
    where: { id: doc.id }
  });

  if (doc.fileUrl && fs.existsSync(doc.fileUrl)) {
    fs.unlinkSync(doc.fileUrl);
  }
}
