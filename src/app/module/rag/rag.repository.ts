import { prisma } from "../../lib/prisma";

interface RelevantChunk {
  source: string;
  content: string;
  score: number;
}

function cosineSimilarity(left: number[], right: number[]): number {
  if (left.length === 0 || left.length !== right.length) {
    throw new Error("Cannot compare embeddings with different dimensions.");
  }

  let dotProduct = 0;
  let leftMagnitude = 0;
  let rightMagnitude = 0;

  for (let index = 0; index < left.length; index++) {
    dotProduct += left[index] * right[index];
    leftMagnitude += left[index] ** 2;
    rightMagnitude += right[index] ** 2;
  }

  const magnitudeProduct = Math.sqrt(leftMagnitude) * Math.sqrt(rightMagnitude);

  return magnitudeProduct === 0 ? 0 : dotProduct / magnitudeProduct;
}

export async function findRelevantChunks(
  queryEmbedding: number[],
  limit: number,
): Promise<RelevantChunk[]> {
  const chunks = await prisma.ragChunk.findMany({
    select: {
      source: true,
      content: true,
      embedding: true,
    },
  });

  return chunks
    .map((chunk) => ({
      source: chunk.source,
      content: chunk.content,
      score: cosineSimilarity(queryEmbedding, chunk.embedding),
    }))
    .sort((left, right) => right.score - left.score)
    .slice(0, limit);
}
