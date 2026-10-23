import status from "http-status";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { Request, Response } from "express";
import { IRequestUser } from "../../interfaces/requestUser.interface";
import { statsService } from "./stats.service";

/*********************************
 * Get Dashboard Stats Data
 ********************************/
const getDashboardStatsData = catchAsync(
  async (req: Request, res: Response) => {
    const user = req.user as IRequestUser;
    const result = await statsService.getDashboardStatsData(user);

    sendResponse(res, {
      success: true,
      message: "Stats data retrieved successfully",
      statusCode: status.OK,
      data: result,
    });
  },
);

export const statsController = {
  getDashboardStatsData,
};
