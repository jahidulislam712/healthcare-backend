import z from "zod";

export const createSpecialtyZodSchema = z.object({
  title: z
    .string("Specialty name must be string")
    .trim()
    .min(1, "Specialty name is required.")
    .max(100, "Specialty name cannot exceed 100 characters"),
  description: z.string().optional(),
  icon: z.string().optional(),
});
export type ICreateSpecialtyPayload = z.infer<typeof createSpecialtyZodSchema>

export const updateSpecialtyZodSchema = z.object({
  title: z
    .string("Specialty name must be string")
    .trim()
    .min(1, "Specialty name is required.")
    .max(100, "Specialty name cannot exceed 100 characters")
    .optional(),
  description: z.string().optional(),
  icon: z.string().optional(),
});
export type IUpdateSpecialtyPayload = z.output<typeof updateSpecialtyZodSchema>
