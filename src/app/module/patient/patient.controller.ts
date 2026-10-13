import { Request, Response } from "express";
import { catchAsync } from "../../shared/catchAsync";
import { patientService } from "./patient.service";
import { IRequestUser } from "../../interfaces/requestUser.interface";
import { sendResponse } from "../../shared/sendResponse";
import status from "http-status";
import { IPatientFiles } from "./patient.interface";

/*********************************
 * Get All Schedules
 ********************************/
const updatePatientprofile = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as IRequestUser
  const files = req.files as unknown as IPatientFiles
  const result = await patientService.updatePatientProfile(user, req.body, files)

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