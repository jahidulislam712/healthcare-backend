import status from "http-status";
import { uploadPDFToCloudinary } from "../../config/cloudinary.config";
import { Role } from "../../../generated/prisma/enums";
import {
  getParseMedicineDetails,
  searchParseMedicines,
} from "../../config/parse";
import AppError from "../../errorHelpers/appError";
import { IRequestUser } from "../../interfaces/requestUser.interface";
import { IQueryParams } from "../../interfaces/query.interface";
import { prisma } from "../../lib/prisma";
import { sendEmail } from "../../services/email/sendEmail";
import { PrescriptionPDFData } from "../../templates/pdf/interface";
import { generatePrescriptionPDF } from "../../templates/pdf/prescription";
import {
  ICreatePrescriptionPayload,
  IUpdatePrescriptionPayload,
} from "./prescription.interface";

const getAllPrescriptions = async (
  user: IRequestUser,
  query: IQueryParams,
) => {
  let ownerFilter = {};
  if (user.role === Role.DOCTOR) {
    ownerFilter = { doctor: { userId: user.sub } };
  } else if (user.role === Role.PATIENT) {
    ownerFilter = { patient: { userId: user.sub } };
  } else if (user.role !== Role.ADMIN && user.role !== Role.SUPER_AMDIN) {
    throw new AppError(status.FORBIDDEN, "You cannot view prescriptions");
  }

  const page = Math.max(1, Math.floor(Number(query.page) || 1));
  const limit = Math.min(100, Math.max(1, Math.floor(Number(query.limit) || 10)));
  const sortField = ["createdAt", "updatedAt", "followUpDate"].includes(
    String(query.sortBy),
  )
    ? String(query.sortBy)
    : "createdAt";
  const sortOrder = query.sortOrder === "asc" ? "asc" : "desc";
  const where = {
    ...ownerFilter,
    ...(query.searchTerm && {
      OR: [
        {
          diagnosis: {
            contains: String(query.searchTerm),
            mode: "insensitive" as const,
          },
        },
        {
          instructions: {
            contains: String(query.searchTerm),
            mode: "insensitive" as const,
          },
        },
      ],
    }),
  };

  const [total, data] = await Promise.all([
    prisma.prescription.count({ where }),
    prisma.prescription.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { [sortField]: sortOrder },
      include: {
        patient: true,
        doctor: true,
        appointment: true,
        prescriptionMedicines: { include: { medicine: true } },
      },
    }),
  ]);

  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const searchMedicines = async (query: string) => {
  const normalizedQuery = query.trim();
  if (!normalizedQuery) {
    throw new AppError(status.BAD_REQUEST, "A medicine search query is required");
  }

  return searchParseMedicines(normalizedQuery);
};

const getMedicineDetails = async (medicineId: string) => {
  const normalizedId = medicineId.trim();
  if (!normalizedId) {
    throw new AppError(status.BAD_REQUEST, "A medicine ID is required");
  }

  return getParseMedicineDetails(normalizedId);
};

const getAge = (dateOfBirth?: Date | null): number | string => {
  if (!dateOfBirth) {
    return "Not provided";
  }

  const now = new Date();
  let age = now.getFullYear() - dateOfBirth.getFullYear();
  const birthdayHasNotOccurred =
    now.getMonth() < dateOfBirth.getMonth() ||
    (now.getMonth() === dateOfBirth.getMonth() &&
      now.getDate() < dateOfBirth.getDate());

  if (birthdayHasNotOccurred) {
    age -= 1;
  }

  return age;
};

const generateAndUploadPrescriptionPDF = async (
  data: PrescriptionPDFData,
  fileName: string,
) => {
  const pdfBuffer = await generatePrescriptionPDF(data);
  return uploadPDFToCloudinary(pdfBuffer, fileName);
};

const createPrescription = async (
  user: IRequestUser,
  payload: ICreatePrescriptionPayload,
) => {
  if (!payload.appointmentId?.trim()) {
    throw new AppError(status.BAD_REQUEST, "An appointment ID is required");
  }
  if (!payload.instruction?.trim()) {
    throw new AppError(status.BAD_REQUEST, "Prescription instructions are required");
  }
  if (
    (payload.medicines ?? []).some(
      (medicine) =>
        !medicine.externalId?.trim() ||
        !medicine.genericName?.trim() ||
        !medicine.dosage?.trim() ||
        !medicine.frequency?.trim() ||
        !medicine.duration?.trim(),
    )
  ) {
    throw new AppError(
      status.BAD_REQUEST,
      "Each medicine requires an external ID, generic name, dosage, frequency, and duration",
    );
  }

  const doctor = await prisma.doctor.findUniqueOrThrow({
    where: { userId: user.sub },
  });

  const appointment = await prisma.appointment.findUniqueOrThrow({
    where: { id: payload.appointmentId },
    include: {
      patient: { include: { patientHealthData: true } },
      doctor: {
        include: {
          specialties: { include: { specialty: true } },
        },
      },
      schedule: true,
    },
  });

  if (appointment.doctorId !== doctor.id) {
    throw new AppError(
      status.BAD_REQUEST,
      "You can only give a prescription for your own appointments",
    );
  }

  const existingPrescription = await prisma.prescription.findUnique({
    where: { appointmentId: payload.appointmentId },
  });
  if (existingPrescription) {
    throw new AppError(
      status.BAD_REQUEST,
      "A prescription already exists for this appointment",
    );
  }

  const followUpDate = payload.followUpDate
    ? new Date(payload.followUpDate)
    : null;
  if (followUpDate && Number.isNaN(followUpDate.getTime())) {
    throw new AppError(status.BAD_REQUEST, "Follow-up date is invalid");
  }

  const issuedDate = new Date();
  const fileName = `Prescription-${appointment.id}.pdf`;

  const prescription = await prisma.$transaction(
    async (tx) => {
      const prescriptionMedicines = [];

      for (const item of payload.medicines ?? []) {
        const medicine = await tx.medicine.upsert({
          where: {
            catalogSource_externalId: {
              catalogSource: "parse",
              externalId: item.externalId,
            },
          },
          create: {
            catalogSource: "parse",
            externalId: item.externalId,
            brandName: item.brandName,
            genericName: item.genericName,
            strength: item.strength,
            dosageForm: item.dosageForm,
            manufacturer: item.manufacturer,
            atcCode: item.atcCode,
          },
          update: {
            brandName: item.brandName,
            genericName: item.genericName,
            strength: item.strength,
            dosageForm: item.dosageForm,
            manufacturer: item.manufacturer,
            atcCode: item.atcCode,
          },
        });

        prescriptionMedicines.push({
          medicineId: medicine.id,
          dosage: item.dosage,
          frequency: item.frequency,
          duration: item.duration,
          instructions: item.instructions,
          medicineName: item.brandName || item.genericName,
          strength: item.strength,
          dosageForm: item.dosageForm,
        });
      }

      const createdPrescription = await tx.prescription.create({
        data: {
          appointmentId: appointment.id,
          doctorId: doctor.id,
          patientId: appointment.patientId,
          followUpDate,
          diagnosis: payload.diagnosis,
          instructions: payload.instruction,
          prescriptionMedicines: { create: prescriptionMedicines },
        },
      });

      const specialization = appointment.doctor.specialties
        .map(({ specialty }) => specialty.title)
        .join(", ");
      const uploadedFile = await generateAndUploadPrescriptionPDF({
        prescriptionId: createdPrescription.id,
        doctorName: doctor.name,
        doctorEmail: doctor.email,
        doctorSpecialization: specialization,
        doctorPhone: doctor.contactNumber ?? "",
        patientName: appointment.patient.name,
        patientEmail: appointment.patient.email,
        patientAge: getAge(appointment.patient.patientHealthData?.dateOfBirth),
        patientGender:
          appointment.patient.patientHealthData?.gender ?? "Not provided",
        appointmentDate: appointment.schedule.startDateTime.toLocaleDateString(),
        issuedDate: issuedDate.toLocaleDateString(),
        followUpDate: followUpDate?.toLocaleDateString(),
        diagnosis: payload.diagnosis ?? "",
        instructions: payload.instruction,
        medicines: (payload.medicines ?? []).map((medicine) => ({
          name: medicine.brandName || medicine.genericName,
          dosage: medicine.dosage,
          frequency: medicine.frequency,
          duration: medicine.duration,
        })),
      }, fileName);
      const updatedPrescription = await tx.prescription.update({
        where: { id: createdPrescription.id },
        data: { pdfUrl: uploadedFile.secure_url },
        include: {
          prescriptionMedicines: { include: { medicine: true } },
        },
      });

      return updatedPrescription;
    },
    { maxWait: 15000, timeout: 60000 },
  );

  try {
    await sendEmail({
      to: appointment.patient.email,
      subject: `You have received a new prescription from Dr. ${doctor.name}`,
      templateName: "prescription",
      templateData: {
        doctorName: doctor.name,
        patientName: appointment.patient.name,
        prescriptionId: prescription.id,
        instructions: payload.instruction,
        pdfUrl: prescription.pdfUrl,
      },
    });
  } catch (error) {
    console.error("Failed to send prescription email notification", error);
  }

  return prescription;
};

const updatePrescription = async (
  user: IRequestUser,
  prescriptionId: string,
  payload: IUpdatePrescriptionPayload,
) => {
  if (
    payload.followUpDate === undefined &&
    payload.diagnosis === undefined &&
    payload.instruction === undefined
  ) {
    throw new AppError(status.BAD_REQUEST, "At least one field is required to update");
  }
  if (payload.instruction !== undefined && !payload.instruction.trim()) {
    throw new AppError(status.BAD_REQUEST, "Prescription instructions cannot be empty");
  }

  const doctor = await prisma.doctor.findUniqueOrThrow({
    where: { userId: user.sub },
  });
  const existingPrescription = await prisma.prescription.findUniqueOrThrow({
    where: { id: prescriptionId },
    include: {
      doctor: {
        include: { specialties: { include: { specialty: true } } },
      },
      patient: { include: { patientHealthData: true } },
      appointment: { include: { schedule: true } },
      prescriptionMedicines: { include: { medicine: true } },
    },
  });

  if (existingPrescription.doctorId !== doctor.id) {
    throw new AppError(
      status.BAD_REQUEST,
      "You can only update prescriptions for your own appointments",
    );
  }

  const followUpDate =
    payload.followUpDate === undefined
      ? existingPrescription.followUpDate
      : payload.followUpDate
        ? new Date(payload.followUpDate)
        : null;
  if (followUpDate && Number.isNaN(followUpDate.getTime())) {
    throw new AppError(status.BAD_REQUEST, "Follow-up date is invalid");
  }

  const updatedPrescription = await prisma.$transaction(
    async (tx) => {
      const updated = await tx.prescription.update({
        where: { id: existingPrescription.id },
        data: {
          ...(payload.followUpDate !== undefined && { followUpDate }),
          ...(payload.diagnosis !== undefined && { diagnosis: payload.diagnosis }),
          ...(payload.instruction !== undefined && {
            instructions: payload.instruction,
          }),
        },
      });

      const specialization = existingPrescription.doctor.specialties
        .map(({ specialty }) => specialty.title)
        .join(", ");
      const uploadedFile = await generateAndUploadPrescriptionPDF(
        {
          prescriptionId: updated.id,
          doctorName: existingPrescription.doctor.name,
          doctorEmail: existingPrescription.doctor.email,
          doctorSpecialization: specialization,
          doctorPhone: existingPrescription.doctor.contactNumber ?? "",
          patientName: existingPrescription.patient.name,
          patientEmail: existingPrescription.patient.email,
          patientAge: getAge(
            existingPrescription.patient.patientHealthData?.dateOfBirth,
          ),
          patientGender:
            existingPrescription.patient.patientHealthData?.gender ??
            "Not provided",
          appointmentDate:
            existingPrescription.appointment.schedule.startDateTime.toLocaleDateString(),
          issuedDate: new Date().toLocaleDateString(),
          followUpDate: followUpDate?.toLocaleDateString(),
          diagnosis: payload.diagnosis ?? existingPrescription.diagnosis ?? "",
          instructions: payload.instruction ?? existingPrescription.instructions,
          medicines: existingPrescription.prescriptionMedicines.map((item) => ({
            name: item.medicineName,
            dosage: item.dosage,
            frequency: item.frequency,
            duration: item.duration,
          })),
        },
        `Prescription-${existingPrescription.appointmentId}.pdf`,
      );

      return tx.prescription.update({
        where: { id: updated.id },
        data: { pdfUrl: uploadedFile.secure_url },
        include: {
          prescriptionMedicines: { include: { medicine: true } },
        },
      });
    },
    { maxWait: 15000, timeout: 60000 },
  );

  return updatedPrescription;
};

export const prescriptionService = {
  getAllPrescriptions,
  searchMedicines,
  getMedicineDetails,
  createPrescription,
  updatePrescription,
};
