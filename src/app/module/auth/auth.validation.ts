import z from "zod";

export const forgetPasswordZodSchema = z.object({
  email: z.email().transform((email) => email.trim().toLowerCase()),
});

export const resetPasswordZodSchema = z.object({
  email: z.email().transform((email) => email.trim().toLowerCase()),
  otp: z.string().regex(/^\d{6}$/, "Enter the 6-digit code"),
  password: z.string().min(8).max(128),
});
