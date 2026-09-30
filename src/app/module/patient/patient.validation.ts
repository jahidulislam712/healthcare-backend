import * as z from "zod";
import {
  BloodGroup,
  Gender,
  MaritalStatus,
} from "../../../generated/prisma/enums";

export const updatePatientProfileZodSchema = z.object({
  patientInfo: z.object({
    name: z
      .string()
      .min(2, "Name must be at least 3 character")
      .max(100, "Name must be less than 100 characters")
      .optional(),
    profilePhoto: z.string().optional(),
    contactNumber: z.string().optional(),
    address: z.string().optional(),
  }).optional,

  patientHealthData: z
    .object({
      gender: z.enum(Gender).optional(),
      dateOfBirth: z
        .string()
        .refine((date) => !isNaN(Date.parse(date)))
        .optional(),
      bloodGroup: z.enum(BloodGroup).optional(),
      hasAllergies: z.boolean().optional(),
      hasDiabetes: z.boolean().optional(),
      height: z.string().optional(),
      weight: z.string().optional(),
      smokingStatus: z.boolean().optional(),
      dietaryPreferences: z.string().optional(),
      pregnancyStatus: z.boolean().optional(),
      mentalHealthHistory: z.string().optional(),
      immunizationStatus: z.string().optional(),
      hasPastSurgeries: z.boolean().optional(),
      recentAnxiety: z.boolean().optional(),
      recentDepression: z.boolean().optional(),
      maritalStatus: z.enum(MaritalStatus).optional(),
    })
    .optional(),

  medicalReports: z
    .array(
      z.object({
        reportName: z.string().optional(),
        reportLink: z.string().optional(),
        reportId: z.uuid().optional(),
        shouldDelete: z.boolean().optional(),
      }),
    )
    .optional()
    .refine((reports) => {
      if (!reports || reports.length === 0) return true; // if no reports, it's valid

      for (const report of reports) {
        // case-1
        if (report.shouldDelete === true && !report.reportId) {
          return false;
        }

        // case-2
        if (report.reportId && report.shouldDelete !== true) {
          return false;
        }

        // case-3
        if (report.reportName && !report.reportLink) {
          return false;
        }
        // case-4
        if (!report.reportName && report.reportLink) {
          return false;
        }
      }

      return true;
    }),
});
