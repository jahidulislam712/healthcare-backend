export interface Doctor {
  name: string;
  email: string;
  specialization: string;
  phone: string;
}

export interface Patient {
  name: string;
  email: string;
  age: number | string;
  gender: string;
}

export interface Medicine {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
}

export interface Prescription {
  prescriptionId: string;

  doctor: Doctor;
  patient: Patient;

  appointmentDate: string;
  issuedDate: string;
  followUpDate?: string;

  diagnosis: string;
  instructions: string;

  medicines: Medicine[];
}

export interface PrescriptionPDFData {
  prescriptionId: string;

  doctorName: string;
  doctorEmail: string;
  doctorSpecialization: string;
  doctorPhone: string;

  patientName: string;
  patientEmail: string;
  patientAge: number | string;
  patientGender: string;

  appointmentDate: string;
  issuedDate: string;
  followUpDate?: string;

  diagnosis: string;
  instructions: string;

  medicines: Medicine[];
}

export interface PDFOptions {
  doc: PDFKit.PDFDocument;
}

export const PAGE_WIDTH = 595;
export const PAGE_HEIGHT = 842;

export const MARGIN = 50;

export const CONTENT_WIDTH =
  PAGE_WIDTH - MARGIN * 2;

export const COLORS = {
  primary: "#1F4E79",
  secondary: "#EAF2F8",
  border: "#B8C4CE",
  text: "#222222",
  muted: "#666666",
  white: "#FFFFFF",
  light: "#F7F9FA",
};
