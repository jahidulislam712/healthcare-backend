import { Specialty } from "../../../generated/prisma/client";
import { prisma } from "../../lib/prisma";

const createSpecialty = async (payload: Specialty): Promise<Specialty> => {
  const createdSpecialty = await prisma.specialty.create({ data: payload });

  return createdSpecialty;
};

const getAllSpecialties = async (): Promise<Specialty[]> => {
  const result = await prisma.specialty.findMany();

  return result;
};

const deleteSpecialty = async (id: string): Promise<Specialty> => {
  const deletedSpecialty = await prisma.specialty.delete({
    where: {
      id: id,
    },
  });

  return deletedSpecialty;
};

export const specialtyService = {
  createSpecialty,
  getAllSpecialties,
  deleteSpecialty,
};
