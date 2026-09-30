import { addHours, addMinutes, format } from "date-fns";
import {
  ICreateSchedulePayload,
  IUpdateSchedulePayload,
} from "./schedule.interface";
import { prisma } from "../../lib/prisma";
import { QueryBuilder } from "../../utils/queryBuilder";
import { IQueryParams } from "../../interfaces/query.interface";
import { scheduleSearchableFields } from "./schedule.constant";
import AppError from "../../errorHelpers/appError";
import status from "http-status";

/*********************************
 * Create Schedules
 ********************************/
const createSchedule = async (payload: ICreateSchedulePayload) => {
  const { startDate, endDate, startTime, endTime } = payload;

  const currentDate = new Date(startDate); // 2026-09-13
  const lastDate = new Date(endDate); // 2026-09-15

  const schedules = [];
  const interval = 30;

  while (currentDate <= lastDate) {
    const startDateTime = addMinutes(
      addHours(
        format(currentDate, "yyyy-MM-dd"),
        Number(startTime.split(":")[0]),
      ),
      Number(startTime.split(":")[1]),
    ); // e.g: 2026-09-13 09:00AM

    const endDateTime = addMinutes(
      addHours(
        format(currentDate, "yyyy-MM-dd"),
        Number(endTime.split(":")[0]),
      ),
      Number(endTime.split(":")[1]),
    ); // e.g: 2026-09-13 05:00PM

    while (startDateTime < endDateTime) {
      const scheduleData = {
        startDateTime: startDateTime,
        endDateTime: addMinutes(startDateTime, interval),
      };

      const existingSchedule = await prisma.schedule.findFirst({
        where: {
          startDateTime: scheduleData.startDateTime,
          endDateTime: scheduleData.endDateTime,
        },
      });

      if (!existingSchedule) {
        const result = await prisma.schedule.create({
          data: scheduleData,
        });

        schedules.push(result);
      }

      startDateTime.setMinutes(startDateTime.getMinutes() + interval);
    }

    // increment 1 day
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return schedules;
};

/*********************************
 * Get All Schedules
 ********************************/
const getAllSchedule = async (query: IQueryParams) => {
  const queryBulider = new QueryBuilder(prisma.schedule, query, {
    searchableFields: scheduleSearchableFields,
  });

  const result = queryBulider.search().sort().paginate().fields().execute();

  return result;
};

/*********************************
 * Update Schedule
 ********************************/
const updateSchedule = async (
  scheduleId: string,
  payload: IUpdateSchedulePayload,
) => {
  const { startDate, endDate, startTime, endTime } = payload;

  const schedule = await prisma.schedule.findUnique({
    where: {
      id: scheduleId,
    },
  });

  if (!schedule) {
    throw new AppError(status.NOT_FOUND, "Schedule not found!!");
  }

  const startDateTime = addMinutes(
    addHours(
      format(new Date(startDate), "yyyy-MM-dd"),
      Number(startTime.split(":")[0]),
    ),
    Number(startTime.split(":")[1]),
  );

  const endDateTime = addMinutes(
    addHours(
      format(new Date(endDate), "yyyy-MM-dd"),
      Number(endTime.split(":")[0]),
    ),
    Number(endTime.split(":")[1]),
  );

  const result = await prisma.schedule.update({
    where: { id: scheduleId },
    data: {
      startDateTime,
      endDateTime,
    },
  });

  return result;
};

export const scheduleService = {
  createSchedule,
  getAllSchedule,
  updateSchedule,
};
