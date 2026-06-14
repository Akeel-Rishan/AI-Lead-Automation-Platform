import { prisma } from "./prisma";

export type SimilarChunk = {
  id: string;
  docId: string;
  content: string;
  chunkIndex: number;
  similarity: number;
};

function toVectorString(embedding: number[]) {
  return `[${embedding.join(",")}]`;
}

export async function saveEmbedding(chunkId: string, embedding: number[]): Promise<void> {
  const vector = toVectorString(embedding);

  await prisma.$executeRaw`
    UPDATE "DocChunk"
    SET embedding = ${vector}::vector
    WHERE id = ${chunkId}
  `;
}

export async function searchSimilarChunks(
  tenantId: string,
  queryEmbedding: number[],
  limit = 5
): Promise<SimilarChunk[]> {
  const vector = toVectorString(queryEmbedding);
  const rows = await prisma.$queryRaw<SimilarChunk[]>`
    SELECT
      dc.id,
      dc."docId",
      dc.content,
      dc."chunkIndex",
      1 - (dc.embedding <=> ${vector}::vector) as similarity
    FROM "DocChunk" dc
    INNER JOIN "KnowledgeDoc" kd ON dc."docId" = kd.id
    WHERE dc."tenantId" = ${tenantId}
      AND kd."isActive" = true
      AND dc.embedding IS NOT NULL
    ORDER BY dc.embedding <=> ${vector}::vector
    LIMIT ${limit}
  `;

  return rows.map((row) => ({
    ...row,
    similarity: Number(row.similarity)
  }));
}

export async function deleteChunkEmbeddings(docId: string): Promise<void> {
  await prisma.docChunk.deleteMany({
    where: { docId }
  });
}
