import { z } from "zod";

export const ingestDocumentSchema = z.object({
  source: z.string().trim().min(1).max(200),
  text: z.string().trim().min(1).max(20_000),
});

export const askQuestionSchema = z.object({
  question: z.string().trim().min(1).max(2_000),
});
