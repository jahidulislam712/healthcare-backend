import { IRequestUser } from "../../interfaces/requestUser.interface";
import { prisma } from "../../lib/prisma";
import {
  IUpdatePatientHelthDataPayload,
  IUpdatePatientProfilePayload,
} from "./patient.interface";
import { convertToDateTime } from "./patient.utils";

const updatePatientProfile = async (
  user: IRequestUser,
  payload: IUpdatePatientProfilePayload,
) => {
  const patient = await prisma.patient.findUniqueOrThrow({
    where: { userId: user.sub },
  });

  await prisma.$transaction(async (tx) => {
    // update patient info
    if (payload.patientInfo) {
      await tx.patient.update({
        where: { id: patient.id },
        data: { ...payload.patientInfo },
      });

      // update user according to patient name & profile photo
      if (payload.patientInfo.name || payload.patientInfo.profilePhoto) {
        const userData = {
          name: payload.patientInfo.name
            ? payload.patientInfo.name
            : patient.name,
          image: payload.patientInfo.profilePhoto
            ? payload.patientInfo.profilePhoto
            : patient.profilePhoto,
        };

        await tx.user.update({
          where: { id: patient.userId },
          data: { ...userData },
        });
      }
    }

    // update patient health data
    if (payload.patientHealthData) {
      const healthDataToSave: IUpdatePatientHelthDataPayload = {
        ...payload.patientHealthData,
      };

      if (payload.patientHealthData.dateOfBirth) {
        healthDataToSave.dateOfBirth = convertToDateTime(
          typeof healthDataToSave.dateOfBirth === "string"
            ? healthDataToSave.dateOfBirth
            : undefined,
        ) as Date;
      }

      await tx.patientHealthData.upsert({
        where: { id: patient.id },
        update: healthDataToSave,
        create: {
          patientId: patient.id,
          ...healthDataToSave,
        },
      });
    }

    // patient Medical reports
    if (
      payload.medicalReports &&
      Array.isArray(payload.medicalReports) &&
      payload.medicalReports.length > 0
    ) {
      for (const report of payload.medicalReports) {
        if (report.shouldDelete && report.reportId) {
          await tx.medicalReport.delete({
            where: { id: report.reportId },
          });
        } else {
          await tx.medicalReport.create({
            data: {
              reportName: report.reportName,
              reportLink: report.reportLink,
              patientId: patient.id,
            },
          });
        }
      }
    }
  });

  const result = await prisma.patient.findUnique({
    where: { id: patient.id },
    include: {
      user: true,
      patientHealthData: true,
      medicalReports: true,
    },
  });

  return result;
};

export const patientService = {
  updatePatientProfile,
};
