CREATE EXTENSION IF NOT EXISTS vector;

ALTER TABLE "DocChunk" ADD COLUMN IF NOT EXISTS embedding vector(1536);

CREATE INDEX IF NOT EXISTS doc_chunk_embedding_idx
ON "DocChunk" USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);
