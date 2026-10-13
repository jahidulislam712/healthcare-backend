import { Request, Response } from "express";
import { catchAsync } from "../../shared/catchAsync";
import { IRequestUser } from "../../interfaces/requestUser.interface";
import { sendResponse } from "../../shared/sendResponse";
import status from "http-status";
import { reviewService } from "./review.service";


/*********************************
 * Get All Reviews
 ********************************/
const getAllReviews = catchAsync(async (req: Request, res: Response) => {
  
  const result = await reviewService.getAllReviews(req.query)

  sendResponse(res, {
    success: true,
    message: "Retrived reviews successfully",
    statusCode: status.OK,
    data: result,
  });
});

/*********************************
 * Get All Reviews
 ********************************/
const createReview = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as IRequestUser
  const result = await reviewService.createReview(user, req.body)

  sendResponse(res, {
    success: true,
    message: "Reviewed successfully",
    statusCode: status.CREATED,
    data: result,
  });
});

export const reviewController = {
  getAllReviews,
  createReview
}