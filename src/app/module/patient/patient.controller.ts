import { Request, Response } from "express";
import { catchAsync } from "../../shared/catchAsync";
import { patientService } from "./patient.service";
import { IRequestUser } from "../../interfaces/requestUser.interface";
import { sendResponse } from "../../shared/sendResponse";
import status from "http-status";

/*********************************
 * Get All Schedules
 ********************************/
const updatePatientprofile = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as IRequestUser
  const result = await patientService.updatePatientProfile(user, req.body)

  sendResponse(res, {
    success: true,
    message: "Updated profile successfully",
    statusCode: status.OK,
    data: result,
  });
});

export const patientController = {
  updatePatientprofile
}