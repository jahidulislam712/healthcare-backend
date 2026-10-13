import { Request, Response } from "express";
import { catchAsync } from "../../shared/catchAsync";
import { IRequestUser } from "../../interfaces/requestUser.interface";
import { sendResponse } from "../../shared/sendResponse";
import status from "http-status";
import { prescriptionService } from "./prescription.service";
import AppError from "../../errorHelpers/appError";
import { IUpdatePrescriptionPayload } from "./prescription.interface";


/*********************************
 * Get All Prescriptions
 ********************************/
const getAllPrescriptions = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as IRequestUser;
  const result = await prescriptionService.getAllPrescriptions(user, req.query);

  sendResponse(res, {
    success: true,
    message: "Retrieved prescriptions successfully",
    statusCode: status.OK,
    data: result,
  });
});

/*********************************
 * Create Prescription
 ********************************/
const createPrescription = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as IRequestUser
  const result = await prescriptionService.createPrescription(user, req.body)

  sendResponse(res, {
    success: true,
    message: "Prescription created successfully",
    statusCode: status.CREATED,
    data: result,
  });
});

const searchMedicines = catchAsync(async (req: Request, res: Response) => {
  const query = req.query.query;
  if (typeof query !== "string") {
    throw new AppError(status.BAD_REQUEST, "A medicine search query is required");
  }

  const result = await prescriptionService.searchMedicines(query);
  sendResponse(res, {
    success: true,
    message: "Medicine search completed successfully",
    statusCode: status.OK,
    data: result,
  });
});

const getMedicineDetails = catchAsync(async (req: Request, res: Response) => {
  const medicineId = req.params.medicineId;
  if (typeof medicineId !== "string") {
    throw new AppError(status.BAD_REQUEST, "A medicine ID is required");
  }

  const result = await prescriptionService.getMedicineDetails(
    medicineId,
  );
  sendResponse(res, {
    success: true,
    message: "Medicine details retrieved successfully",
    statusCode: status.OK,
    data: result,
  });
});

const updatePrescription = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as IRequestUser;
  const prescriptionId = req.params.prescriptionId;
  if (typeof prescriptionId !== "string") {
    throw new AppError(status.BAD_REQUEST, "A prescription ID is required");
  }

  const result = await prescriptionService.updatePrescription(
    user,
    prescriptionId,
    req.body as IUpdatePrescriptionPayload,
  );
  sendResponse(res, {
    success: true,
    message: "Prescription updated successfully",
    statusCode: status.OK,
    data: result,
  });
});

export const prescriptionController = {
  getAllPrescriptions,
  searchMedicines,
  getMedicineDetails,
  createPrescription,
  updatePrescription,
};