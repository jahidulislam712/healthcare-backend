import { Specialty } from "../../../generated/prisma/client";
import { IQueryParams, IQueryResult } from "../../interfaces/query.interface";
import { prisma } from "../../lib/prisma";
import { QueryBuilder } from "../../utils/queryBuilder";
import {
  ICreateSpecialtyPayload,
  IUpdateSpecialtyPayload,
} from "./specialty.validation";

const createSpecialty = async (
  payload: ICreateSpecialtyPayload,
): Promise<Specialty> => {
  const createdSpecialty = await prisma.specialty.create({ data: payload });

  return createdSpecialty;
};

const getAllSpecialties = async (
  query: IQueryParams,
): Promise<IQueryResult<Specialty>> => {
  const queryBuilder = new QueryBuilder<Specialty>(prisma.specialty, query, {
    searchableFields: ["title", "description"],
  });

  return await queryBuilder
    .search()
    .paginate()
    .include({
      _count: {
        select: { doctorSpecialties: true },
      },
    })
    .sort()
    .execute();
};

const udpateSpecialty = async (
  id: string,
  payload: IUpdateSpecialtyPayload,
): Promise<Specialty> => {
  console.log(payload);
  return await prisma.specialty.update({
    data: payload,
    where: {
      id: id,
    },
  });
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
  udpateSpecialty,
  deleteSpecialty,
};
