import { Request, Response } from "express";
import { sendResponse } from "../../shared/sendResponse";
import { catchAsync } from "../../shared/catchAsync";
import { specialtyService } from "./speicalty.service";

const createSpecialty = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;

  const result = await specialtyService.createSpecialty(payload);

  sendResponse(res, {
    statusCode: 201,
    message: "Specialty created succssfully",
    success: true,
    data: result,
  });
});

const getAllSpecialties = catchAsync( async (req: Request, res: Response) => {

  const result = await specialtyService.getAllSpecialties();

  sendResponse(res, {
    statusCode: 201,
    message: "Specialties retrieved succssfully",
    success: true,
    data: result,
  });
} )

const deleteSpecialty = catchAsync( async (req: Request, res: Response) => {

  const id = req.params.id as string

  const result = await specialtyService.deleteSpecialty(id);

  sendResponse(res, {
    statusCode: 201,
    message: "Specialty deleted succssfully",
    success: true,
    data: result,
  });
} )

export const specialtyController = {
  createSpecialty,
  getAllSpecialties,
  deleteSpecialty
};
