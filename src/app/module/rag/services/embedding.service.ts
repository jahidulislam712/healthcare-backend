import { gemini } from "../../../config/gemini.config";

export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await gemini.models.embedContent({
    model: "gemini-embedding-2",
    contents: text,
    config: {
      outputDimensionality: 768,
    },
  });

  const values = response.embeddings?.[0]?.values;

  if (
    !values ||
    values.length !== 768 ||
    values.some((value) => !Number.isFinite(value))
  ) {
    throw new Error("Gemini returned an invalid embedding.");
  }

  return values;
}
