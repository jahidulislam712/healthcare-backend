import status from "http-status";
import AppError from "../../errorHelpers/appError";
import { prisma } from "../../lib/prisma";
import { QueryBuilder } from "../../utils/queryBuilder";
import { doctorSearchableFields } from "./doctor.constant";
import { Doctor } from "../../../generated/prisma/client";
import { IQueryParams } from "../../interfaces/query.interface";

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
    })
    .fields()
    .sort()
    .execute();

  return result;
};

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

export const doctorService = {
  getAllDoctors,
  getDoctorById,
};
