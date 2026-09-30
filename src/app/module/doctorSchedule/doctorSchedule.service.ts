import status from "http-status";
import AppError from "../../errorHelpers/appError";
import { IRequestUser } from "../../interfaces/requestUser.interface";
import { prisma } from "../../lib/prisma";
import {
  ICreatedoctorSchedulePayload,
  IUpdateDoctorSchedulePayload,
} from "./doctorSchedule.interface";
import { QueryBuilder } from "../../utils/queryBuilder";
import { IQueryParams } from "../../interfaces/query.interface";

/*********************************
 * Create DoctorSchedules
 ********************************/
const createDoctorSchedule = async (
  user: IRequestUser,
  payload: ICreatedoctorSchedulePayload,
) => {
  const doctor = await prisma.doctor.findUnique({
    where: {
      userId: user.sub,
    },
  });

  if (!doctor) {
    throw new AppError(status.NOT_FOUND, "Doctor not found!!");
  }

  const scheduleData = payload.scheduleIds.map((id) => {
    return {
      doctorId: doctor.id,
      scheduleId: id,
    };
  });

  await prisma.doctorSchedules.createMany({
    data: scheduleData,
  });

  const result = await prisma.doctorSchedules.findMany({
    where: {
      doctorId: doctor.id,
      scheduleId: {
        in: payload.scheduleIds,
      },
    },
    include: {
      schedule: true,
    },
  });

  return result;
};

/*********************************
 * Get My DoctorSchedules
 ********************************/
const getMyDoctorSchedule = async (user: IRequestUser, query: IQueryParams) => {
  const doctor = await prisma.doctor.findUniqueOrThrow({
    where: {
      userId: user.sub,
    },
  });

  const queryBuilder = new QueryBuilder(
    prisma.doctorSchedules,
    { doctorId: doctor.id, ...query },
    {},
  );

  const result = queryBuilder
    .include({
      schedule: true,
      doctor: {
        include: {
          user: true,
        },
      },
    })
    .search()
    .sort()
    .paginate()
    .execute();

  return result;
};

/*********************************
 * Get All DoctorSchedules
 ********************************/
const getAllDoctorSchedules = async (query: IQueryParams) => {
  const queryBuilder = new QueryBuilder(prisma.doctorSchedules, { query }, {});

  const result = queryBuilder
    .include({
      schedule: true,
      doctor: true
    })
    // .fields()
    .search()
    .sort()
    .paginate()
    .execute();

  return result;
};

/*********************************
 * Update MyDoctorSchedule
 ********************************/
const updateMyDoctorSchedule = async (
  user: IRequestUser,
  payload: IUpdateDoctorSchedulePayload,
) => {
  const doctor = await prisma.doctor.findFirstOrThrow({
    where: {
      userId: user.sub,
    },
  });

  const scheduleIdsToDelete = payload.scheduleIds
    .filter((item) => item.shouldDelete)
    .map((id) => id.scheduleId);
  const scheduleIdsToCreate = payload.scheduleIds
    .filter((item) => !item.shouldDelete)
    .map((id) => id.scheduleId);

  console.log(scheduleIdsToDelete, "delete ids");
  console.log(scheduleIdsToCreate, "create ids");

  await prisma.$transaction(async (tx) => {
    if (scheduleIdsToDelete.length > 0) {
      await tx.doctorSchedules.deleteMany({
        where: {
          doctorId: doctor.id,
          scheduleId: {
            in: scheduleIdsToDelete,
          },
        },
      });
    }

    if (scheduleIdsToCreate.length > 0) {
      await tx.doctorSchedules.createMany({
        data: scheduleIdsToCreate.map((item) => ({
          doctorId: doctor.id,
          scheduleId: item,
        })),
        skipDuplicates: true,
      });
    }

    return prisma.doctorSchedules.findMany({
      where: {
        doctorId: doctor.id,
      },
      include: {
        schedule: true,
      },
    });
  });
};

export const doctorScheduleService = {
  createDoctorSchedule,
  getMyDoctorSchedule,
  getAllDoctorSchedules,
  updateMyDoctorSchedule,
};
