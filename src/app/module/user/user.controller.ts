import { Request, Response } from "express";
import { catchAsync } from "../../shared/catchAsync";
import { userService } from "./user.service";
import { sendResponse } from "../../shared/sendResponse";
import status from "http-status";

const createDoctor = catchAsync(async (req: Request, res: Response) => {
  const result = await userService.createDoctor(req.body);

  sendResponse(res, {
    statusCode: status.CREATED,
    message: "Doctor created successfully",
    success: true,
    data: result,
  });
});

const createAdmin = catchAsync(async (req: Request, res: Response) => {
  const result = await userService.createAdmin(req.body);

  sendResponse(res, {
    statusCode: status.CREATED,
    message: "Admin created successfully",
    success: true,
    data: result,
  });
});

export const userController = {
  createDoctor,
  createAdmin
};
