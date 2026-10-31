import z from "zod";
import { Gender } from "../../../generated/prisma/enums";

export const doctorUpdateDetailsSchema = z.object({
  name: z.string().optional(),
  profilePhoto: z.string().optional(),
  contactNumber: z.string().optional(),
  address: z.string().optional(),
  isDeleted: z.boolean().optional(),
  experience: z.int().nonnegative().optional(),
  gender: z.enum(Gender).optional(),
  appointmentFee: z.number().nonnegative().optional(),
  qualification: z.string().optional(),
  currentWorkingPlace: z.string().optional(),
  designation: z.string().optional(),
});

export const doctorUpdateZodSchema = z
  .object({
    doctor: doctorUpdateDetailsSchema.optional(),
    specialties: z
      .array(
        z.object({
          specialtyId: z.string().min(1),
          action: z.enum(["ADD", "REMOVE"]),
        }),
      )
      .optional(),
  })
  .refine(
    (data) => data.doctor !== undefined || data.specialties !== undefined,
    {
      message: "At least one of doctor or specialties must be provided",
    },
  );
