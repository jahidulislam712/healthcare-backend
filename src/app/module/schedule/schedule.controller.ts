import { Request, Response } from "express";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import status from "http-status";
import { scheduleService } from "./schedule.service";

const createSchedule = catchAsync(async (req: Request, res: Response) => {
  const result = await scheduleService.createSchedule(req.body);

  sendResponse(res, {
    success: true,
    message: "Schedule created successfully",
    statusCode: status.CREATED,
    data: result,
  });
});

/*********************************
 * Get All Schedules
 ********************************/
const getAllSchedule = catchAsync(async (req: Request, res: Response) => {
  const result = await scheduleService.getAllSchedule(req.query);

  sendResponse(res, {
    success: true,
    message: "All schedules retrived successfully",
    statusCode: status.OK,
    data: result,
  });
});

/*********************************
 * Update Schedule
 ********************************/
const updateSchedule = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await scheduleService.updateSchedule(
    id as string,
    req.body,
  );

  sendResponse(res, {
    success: true,
    message: "Schedule updated successfully",
    statusCode: status.OK,
    data: result,
  });
});

export const scheduleController = {
  createSchedule,
  getAllSchedule,
  updateSchedule,
};
