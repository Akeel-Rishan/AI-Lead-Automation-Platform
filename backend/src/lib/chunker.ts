export type ChunkOptions = {
  chunkSize?: number;
  overlap?: number;
};

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

function splitIntoSentences(text: string) {
  return text
    .split(/(?<=[.!?])\s+|\n{2,}/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

export function chunkText(text: string, options: ChunkOptions = {}): string[] {
  const chunkSize = options.chunkSize ?? 500;
  const overlap = options.overlap ?? 50;
  const sentences = splitIntoSentences(text);
  const chunks: string[] = [];
  let currentChunk = "";

  for (const sentence of sentences) {
    const nextChunk = currentChunk ? `${currentChunk} ${sentence}` : sentence;

    if (nextChunk.length > chunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      const overlapPrefix = currentChunk.slice(Math.max(0, currentChunk.length - overlap)).trim();
      currentChunk = overlapPrefix ? `${overlapPrefix} ${sentence}` : sentence;
    } else {
      currentChunk = nextChunk;
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks.filter((chunk) => chunk.length >= 50);
}
