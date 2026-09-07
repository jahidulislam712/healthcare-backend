import { Request, Response } from "express";
import { catchAsync } from "../../shared/catchAsync";
import { authService } from "./auth.service";
import { sendResponse } from "../../shared/sendResponse";
import status from "http-status";
import { tokenUtils } from "../../utils/token";
import AppError from "../../errorHelpers/appError";

const registerPatient = catchAsync(async (req: Request, res: Response) => {
  const result = await authService.registerPatient(req.body);

  sendResponse(res, {
    statusCode: 201,
    message: "Patient registered Successfully",
    success: true,
    data: result,
  });
});

const loginUser = catchAsync(async (req: Request, res: Response) => {
  const result = await authService.loginUser(req.body);
  const { token, accessToken, refreshToken, ...rest } = result;

  tokenUtils.setAccessTokenCookie(res, accessToken);
  tokenUtils.setRefreshTokenCookie(res, refreshToken);
  tokenUtils.setBetterAuthSessionCookie(res, token);

  sendResponse(res, {
    statusCode: status.OK,
    message: "User logged in Successfully",
    success: true,
    data: {
      token,
      accessToken,
      refreshToken,
      ...rest,
    },
  });
});

const getMe = catchAsync(async (req: Request, res: Response) => {
  const user = await authService.getMe(req.user.sub);

  sendResponse(res, {
    statusCode: status.OK,
    message: "retrieved User Profile Successfully",
    success: true,
    data: user,
  });
});

const getNewToken = catchAsync(async (req: Request, res: Response) => {
  const betterAuthSessionToken = req.cookies["better-auth.session_token"];
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    throw new AppError(status.UNAUTHORIZED, "Refresh token not found!!");
  }

  const result = await authService.getNewToken(
    betterAuthSessionToken,
    refreshToken,
  );

  const { sessionToken, accessToken, refreshToken: newRefreshToken } = result;

  tokenUtils.setAccessTokenCookie(res, accessToken);
  tokenUtils.setRefreshTokenCookie(res, newRefreshToken);
  tokenUtils.setBetterAuthSessionCookie(res, sessionToken);

  sendResponse(res, {
    statusCode: status.CREATED,
    message: "New access token generated successfully",
    success: true,
    data: { sessionToken, accessToken, refreshToken: newRefreshToken },
  });
});

/*********************************
 * Change password
 ********************************/
const changePassword = catchAsync(async (req: Request, res: Response) => {
  const sessionToken = req.cookies["better-auth.session_token"];
  const result = await authService.changePassword(req.body, sessionToken);

  sendResponse(res, {
    statusCode: status.OK,
    message: "Password changed successfully",
    success: true,
    data: result,
  });
});

/*********************************
 * Logout user
 ********************************/
const logoutUser = catchAsync(async (req: Request, res: Response) => {
  const sessionToken = req.cookies["better-auth.session_token"];
  const result = await authService.logoutUser(sessionToken);

  sendResponse(res, {
    statusCode: status.OK,
    message: "Logged-out successfully",
    success: true,
    data: result,
  });
});

/*********************************
 * Logout user
 ********************************/
const verifyEmailOtp = catchAsync(async (req: Request, res: Response) => {
  const { email, otp } = req.body;
  const result = await authService.verifyEmailOtp(email, otp);

  sendResponse(res, {
    statusCode: status.OK,
    message: "Completed verification",
    success: true,
    data: result,
  });
});

/*********************************
 * Forget password / request reset-password otp
 ********************************/
const forgetPassword = catchAsync(async (req: Request, res: Response) => {
  const { email } = req.body;
  const result = await authService.forgetPassword(email);

  sendResponse(res, {
    statusCode: status.OK,
    message: "OTP sent successfully, check your email",
    success: true,
    data: result,
  });
});

/*********************************
 * Reset password
 ********************************/
const resetPassword = catchAsync(async (req: Request, res: Response) => {
  const { email, otp, password } = req.body;
  const result = await authService.resetPassword(email, otp, password);

  sendResponse(res, {
    statusCode: status.OK,
    message: "Password reset successfully",
    success: true,
    data: result,
  });
});

export const authController = {
  registerPatient,
  loginUser,
  getMe,
  getNewToken,
  changePassword,
  logoutUser,
  verifyEmailOtp,
  forgetPassword,
  resetPassword,
};
