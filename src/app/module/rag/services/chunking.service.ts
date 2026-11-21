import { DocumentChunk } from "../rag.interface";

export function chunkText(text: string): DocumentChunk[] {
  const normalizedText = text
    .replace(/\r\n/g, "\n")
    .trim();

  if (!normalizedText) {
    return [];
  }

  const chunks: DocumentChunk[] = [];

  let start = 0;
  let chunkIndex = 0;

  while (start < normalizedText.length) {
    let end = Math.min(
      start + 1000,
      normalizedText.length,
    );

    if (end < normalizedText.length) {
      const paragraphBreak = normalizedText.lastIndexOf("\n", end);

      if (paragraphBreak > start + 500) {
        end = paragraphBreak;
      }
    }

    const content = normalizedText.slice(start, end).trim();

    if (content) {
      chunks.push({
        content,
        chunkIndex,
      });

      chunkIndex++;
    }

    if (end === normalizedText.length) {
      break;
    }

    start = end - 150;
  }

  return chunks;
}