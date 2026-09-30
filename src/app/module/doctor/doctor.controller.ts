import { Request, Response } from "express";
import { catchAsync } from "../../shared/catchAsync";
import { doctorService } from "./doctor.service";
import { sendResponse } from "../../shared/sendResponse";
import status from "http-status";

const getAllDoctors = catchAsync(async (req: Request, res: Response) => {
  
  const result = await doctorService.getAllDoctors(req.query);

  sendResponse(res, {
    statusCode: status.OK,
    message: "All doctors retrieved successfully",
    success: true,
    data: result.data,
    meta: result.meta
  });
});

const getDoctorById = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string
  const result = await doctorService.getDoctorById(id);

  sendResponse(res, {
    statusCode: status.CREATED,
    message: "Doctor retrieved successfully",
    success: true,
    data: result,
  });
});

export const doctorController = {
  getAllDoctors,
  getDoctorById
};