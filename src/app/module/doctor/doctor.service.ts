import status from "http-status";
import AppError from "../../errorHelpers/appError";
import { prisma } from "../../lib/prisma";
import { QueryBuilder } from "../../utils/queryBuilder";
import { doctorSearchableFields } from "./doctor.constant";
import { Doctor } from "../../../generated/prisma/client";
import { IQueryParams } from "../../interfaces/query.interface";
import { IUpdateDoctorPayload } from "./doctor.interface";

/*********************************
 * Get All Doctors
 ********************************/
const getAllDoctors = async (query: IQueryParams) => {
  //const doctors = await prisma.doctor.findMany();

  const queryBuilder = new QueryBuilder<Doctor>(prisma.doctor, query, {
    searchableFields: doctorSearchableFields,
  });

  const result = await queryBuilder
    .search()
    .paginate()
    .include({
      user: true,
      specialties: {
        include: {
          specialty: true,
        },
      },
    })
    .fields()
    .sort()
    .execute();

  return result;
};

/*********************************
 * Get Doctor By ID
 ********************************/
const getDoctorById = async (doctorId: string) => {
  const doctor = await prisma.doctor.findUnique({
    where: {
      id: doctorId,
    },
  });

  if (!doctor) {
    throw new AppError(status.NOT_FOUND, "Not doctor found with this id!");
  }

  return doctor;
};

/*********************************
 * Update Doctors
 ********************************/
const updateDoctor = async (id: string, payload: IUpdateDoctorPayload) => {
  
  const doctor = await prisma.doctor.findUnique({ where: { id } });

  if (!doctor) {
    throw new AppError(status.NOT_FOUND, "Doctor not found!");
  }

  if (doctor.isDeleted) {
    throw new AppError(status.BAD_REQUEST, "Doctor doctor is deleted");
  }

  return prisma.$transaction(async (tx) => {
    // update doctor details
    if (payload.doctor) {
      await tx.doctor.update({
        where: { id: doctor.id },
        data: { ...payload.doctor },
      });
    }

    console.log(payload, "payload");

    // upsert doctor specialites
    if (payload.specialties && payload.specialties.length > 0) {
      for (const item of payload.specialties) {
        // create OR update specialites
        if (item.action === "ADD") {
          // check specialty existance
          const specialty = await tx.specialty.findFirst({
            where: { id: item.specialtyId, isDeleted: false },
          });

          if (!specialty)
            throw new AppError(
              status.NOT_FOUND,
              `${item.specialtyId} is not found!!`,
            );

          await tx.doctorSpecialty.upsert({
            create: {
              doctorId: doctor.id,
              specialtyId: item.specialtyId,
            },
            update: {},
            where: {
              doctorId_specialtyId: {
                doctorId: doctor.id,
                specialtyId: item.specialtyId,
              },
            },
          });
        }

        // Delete specialites
        if (item.action === "REMOVE") {
          await tx.doctorSpecialty.deleteMany({
            where: {
              doctorId: doctor.id,
              specialtyId: item.specialtyId,
            },
          });
        }
      }
    }

    return tx.doctor.findUnique({
      where: { id },
      include: {
        specialties: {
          include: {
            specialty: true,
          },
        },
      },
    });
  });
};

export const doctorService = {
  getAllDoctors,
  getDoctorById,
  updateDoctor,
};
