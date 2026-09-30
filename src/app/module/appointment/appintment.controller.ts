import { Request, Response } from "express";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { appointmentService } from "./appintment.service";
import status from "http-status";

const bookAppointment = catchAsync(async (req: Request, res: Response) => {
  const user = req.user
  const result = await appointmentService.bookAppointment(user, req.body);

  sendResponse(res, {
    success: true,
    message: "Booked appointment successfully",
    statusCode: status.CREATED,
    data: result,
  });
});

export const appointmentController = {
  bookAppointment
}