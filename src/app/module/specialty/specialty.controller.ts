import { Request, Response } from "express";
import { sendResponse } from "../../shared/sendResponse";
import { catchAsync } from "../../shared/catchAsync";
import { specialtyService } from "./speicalty.service";
import { ICreateSpecialtyPayload, IUpdateSpecialtyPayload } from "./specialty.validation";

const createSpecialty = catchAsync(async (req: Request, res: Response) => {
  const payload: ICreateSpecialtyPayload = req.body;

  const result = await specialtyService.createSpecialty(payload);

  sendResponse(res, {
    statusCode: 201,
    message: "Specialty created succssfully",
    success: true,
    data: result,
  });
});

const getAllSpecialties = catchAsync(async (req: Request, res: Response) => {

  const result = await specialtyService.getAllSpecialties(req.query);

  sendResponse(res, {
    statusCode: 200,
    message: "Specialties retrieved succssfully",
    success: true,
    data: result.data,
    meta: result.meta
  });
});

const updateSpecialty = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const payload: IUpdateSpecialtyPayload = req.body;

  const result = await specialtyService.udpateSpecialty(id, payload);

  sendResponse(res, {
    statusCode: 201,
    message: "Specialty updated succssfully",
    success: true,
    data: result,
  });
});

const deleteSpecialty = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;

  const result = await specialtyService.deleteSpecialty(id);

  sendResponse(res, {
    statusCode: 201,
    message: "Specialty deleted succssfully",
    success: true,
    data: result,
  });
});

export const specialtyController = {
  createSpecialty,
  getAllSpecialties,
  updateSpecialty,
  deleteSpecialty,
};
