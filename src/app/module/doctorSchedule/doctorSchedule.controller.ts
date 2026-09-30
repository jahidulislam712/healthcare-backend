import status from "http-status";
import { catchAsync } from "../../shared/catchAsync";
import { doctorScheduleService } from "./doctorSchedule.service";
import { sendResponse } from "../../shared/sendResponse";
import { Request, Response } from "express";
import { IRequestUser } from "../../interfaces/requestUser.interface";


/*********************************
 * Create DcotorSchedules
 ********************************/
const createDoctorSchedule = catchAsync(async (req: Request, res: Response) => {
  const user = req.user
  const result = await doctorScheduleService.createDoctorSchedule(user as IRequestUser, req.body);

  sendResponse(res, {
    success: true,
    message: "DoctorSchedule created successfully",
    statusCode: status.CREATED,
    data: result,
  });
});


/*********************************
 * Get My DcotorSchedules
 ********************************/
const getMyDoctorSchedule = catchAsync(async (req: Request, res: Response) => {
  const user = req.user
  const result = await doctorScheduleService.getMyDoctorSchedule(user as IRequestUser, req.query);

  sendResponse(res, {
    success: true,
    message: "Retrived MyDoctorSchedule successfully",
    statusCode: status.OK,
    data: result,
  });
});


/*********************************
 * Get All DoctorSchedule
 ********************************/
const getAllDoctorSchedules = catchAsync(async (req: Request, res: Response) => {
  const query = req.query
  const result = await doctorScheduleService.getAllDoctorSchedules(query);

  sendResponse(res, {
    success: true,
    message: "All doctor schedules",
    statusCode: status.OK,
    data: result,
  });
});

/*********************************
 * Update My DoctorSchedule
 ********************************/
const updateMyDoctorSchedule = catchAsync(async (req: Request, res: Response) => {
  const user = req.user
  const result = await doctorScheduleService.updateMyDoctorSchedule(user as IRequestUser, req.body);

  sendResponse(res, {
    success: true,
    message: "Updated MyDoctorSchedule successfully",
    statusCode: status.OK,
    data: result,
  });
});

export const doctorScheduleController = {
  createDoctorSchedule,
  getMyDoctorSchedule,
  getAllDoctorSchedules,
  updateMyDoctorSchedule
}