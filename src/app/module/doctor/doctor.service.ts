import status from "http-status";
import AppError from "../../errorHelpers/appError";
import { prisma } from "../../lib/prisma";

const getAllDoctors = async () => {
  const doctors = await prisma.doctor.findMany();

  return doctors;
};

const getDoctorById = async (doctorId: string) => {
  const doctor = await prisma.doctor.findUnique({
    where: {
      id: doctorId
    }
  })

  if( !doctor ){
    throw new AppError(status.NOT_FOUND, "Not doctor found with this id!")
  }

  return doctor
}

export const doctorService = {
  getAllDoctors,
  getDoctorById
};
