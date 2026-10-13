export interface ICreatePrescriptionPayload {
  appointmentId: string;
  followUpDate?: string | Date | null;
  diagnosis?: string;
  instruction: string;
  medicines: ICreatePrescriptionMedicinePayload[];
}

export interface ICreatePrescriptionMedicinePayload {
  externalId: string;
  brandName?: string;
  genericName: string;
  strength?: string;
  dosageForm?: string;
  manufacturer?: string;
  atcCode?: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

export interface IUpdatePrescriptionPayload {
  followUpDate?: string | Date | null;
  diagnosis?: string;
  instruction?: string;
}
