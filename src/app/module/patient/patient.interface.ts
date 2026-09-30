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
  gender: Gender;
  dateOfBirth: Date;
  bloodGroup: BloodGroup;
  hasAllergies: boolean;
  hasDiabetes: boolean;
  height: string;
  weight: string;
  smokingStatus: boolean;
  dietaryPreferences: string;
  pregnancyStatus: boolean;
  mentalHealthHistory: string;
  immunizationStatus: string;
  hasPastSurgeries: boolean;
  recentAnxiety: boolean;
  recentDepression: boolean;
  maritalStatus: MaritalStatus;
}
export interface IUpdatePatientMedicalReportPayload {
  reportName: string;
  reportLink: string;
  reportId: string;
  shouldDelete: boolean;
}
export interface IUpdatePatientProfilePayload {
  patientInfo?: IUpdatePatientInfoPayload;
  patientHealthData?: IUpdatePatientHelthDataPayload;
  medicalReports?: IUpdatePatientMedicalReportPayload;
}
