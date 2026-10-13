import { z } from "zod";

export const createReviewZodSchema = z.object({
  appointmentId: z.uuid(),
  rating: z
    .number("Rating is required")
    .min(1, "Rating must be at least 1")
    .max(5, "Rating cannot be more than 5"),
  comment: z
    .string()
    .min(5, "Comment must be more that 5 characters")
    .max(500, "Comment cannot be more than 500 characters"),
});

export const updateReviewZodSchema = z.object({
  rating: z
    .number("Rating is required")
    .min(1, "Rating must be at least 1")
    .max(5, "Rating cannot be more than 5"),
  comment: z
    .string()
    .min(5, "Comment must be more that 5 characters")
    .max(500, "Comment cannot be more than 500 characters"),
});
