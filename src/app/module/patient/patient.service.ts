import status from "http-status";
import {
  deleteImageFromCloudinary,
  uploadImageToCloudinary,
} from "../../config/cloudinary.config";
import AppError from "../../errorHelpers/appError";
import { IRequestUser } from "../../interfaces/requestUser.interface";
import { prisma } from "../../lib/prisma";
import {
  IPatientFiles,
  IUpdatePatientProfilePayload,
} from "./patient.interface";
import { convertToDateTime } from "./patient.utils";

const updatePatientProfile = async (
  user: IRequestUser,
  payload: IUpdatePatientProfilePayload,
  files?: IPatientFiles,
) => {
  const patient = await prisma.patient.findUniqueOrThrow({
    where: { userId: user.sub },
  });

  // console.log(files)
  if (files?.profilePhoto && files.profilePhoto.length > 0) {
    const profilePhoto = files.profilePhoto[0].buffer;
    const profilePhotoData = await uploadImageToCloudinary(profilePhoto);
    if (!payload.patientInfo) {
      payload.patientInfo = {};
    }
    payload.patientInfo.profilePhoto = profilePhotoData.public_id;
  }

  if (files?.medicalReports && files.medicalReports.length > 0) {
    const newReports = await Promise.all(
      files.medicalReports.map(async (report) => {
        const uploadedReportData = await uploadImageToCloudinary(report.buffer);
        return {
          reportLink: uploadedReportData.public_id,
          reportName: report.originalname
            ? report.originalname
            : `Medical Report - ${new Date().getTime()}`,
        };
      }),
    );

    payload.medicalReports = [...(payload.medicalReports || []), ...newReports];
  }

  await prisma.$transaction(async (tx) => {
    // update patient info
    if (payload.patientInfo) {
      const { name, profilePhoto } = payload.patientInfo;
      await tx.patient.update({
        where: { id: patient.id },
        data: { ...payload.patientInfo },
      });

      // update user according to patient name & profile photo
      if (name || profilePhoto) {
        await tx.user.update({
          where: { id: patient.userId },
          data: {
            ...(name && { name }),
            ...(profilePhoto && { image: profilePhoto }),
          },
        });
      }
    }

    // update patient health data
    if (payload.patientHealthData) {
      const existingHealthData = await tx.patientHealthData.findUnique({
        where: { patientId: patient.id },
      });

      const { gender, dateOfBirth, ...rest } = payload.patientHealthData;
      
      const convertedDate = convertToDateTime(dateOfBirth)

      const healthDataToUpdate = {
        ...rest,
        ...(gender && { gender }),
        ...(dateOfBirth && {
          dateOfBirth: convertedDate,
        }),
      };

      if (existingHealthData) {
        await tx.patientHealthData.update({
          where: { patientId: patient.id },
          data: {
            ...healthDataToUpdate,
          },
        });
      } else {
        if (gender === undefined || dateOfBirth === undefined) {
          throw new AppError(
            status.NOT_ACCEPTABLE,
            "Gender and Date of Brith cannot be empty",
          );
        }
        
        if( !convertedDate ){
          throw new AppError(
            status.BAD_REQUEST,
            "Invalid date of birth",
          );
        }
        await tx.patientHealthData.create({
          data: {
            patientId: patient.id,
            gender,
            dateOfBirth: convertedDate,
            ...rest,
          },
        });
      }
    }

    // patient Medical reports
    if (payload.medicalReports && Array.isArray(payload.medicalReports)) {
      for (const report of payload.medicalReports) {
        if (report.shouldDelete && report.reportId) {
          const deletedReport = await tx.medicalReport.delete({
            where: { id: report.reportId },
          });

          if (deletedReport.reportLink) {
            await deleteImageFromCloudinary(deletedReport.reportLink);
          }
        } else if (report.reportName && report.reportLink) {
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
