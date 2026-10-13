import { Prisma } from "../../../generated/prisma/client";
import {
  BloodGroup,
  Gender,
  MaritalStatus,
} from "../../../generated/prisma/enums";

export interface IUpdatePatientInfoPayload {
  name?: string;
  profilePhoto?: string;
  address?: string;
  contactNumber?: string;
}
export interface IUpdatePatientHelthDataPayload {
  gender?: Gender;
  dateOfBirth?: string;
  bloodGroup?: BloodGroup;
  hasAllergies?: boolean;
  hasDiabetes?: boolean;
  heightCm?: Prisma.Decimal | number | string | null;
  weightKg?: Prisma.Decimal | number | string | null;
  smokingStatus?: boolean;
  dietaryPreferences?: string;
  pregnancyStatus?: boolean;
  mentalHealthHistory?: string;
  immunizationStatus?: string;
  hasPastSurgeries?: boolean;
  recentAnxiety?: boolean;
  recentDepression?: boolean;
  maritalStatus?: MaritalStatus;
}
export interface IUpdatePatientMedicalReportPayload {
  reportName?: string;
  reportLink?: string;
  reportId?: string;
  shouldDelete?: boolean;
}
export interface IUpdatePatientProfilePayload {
  patientInfo?: IUpdatePatientInfoPayload;
  patientHealthData?: IUpdatePatientHelthDataPayload;
  medicalReports?: IUpdatePatientMedicalReportPayload[];
}

export interface IPatientFiles {
  profilePhoto: Express.Multer.File[];
  medicalReports: Express.Multer.File[];
}
