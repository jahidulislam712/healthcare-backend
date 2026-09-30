import { Request, Response } from "express";
import { catchAsync } from "../../shared/catchAsync";
import { authService } from "./auth.service";
import { sendResponse } from "../../shared/sendResponse";
import status from "http-status";
import { tokenUtils } from "../../utils/token";
import AppError from "../../errorHelpers/appError";
import { auth } from "../../lib/auth";
import { envVars } from "../../config/env";

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

/*********************************
 * Reset password
 ********************************/
const googleLogin = catchAsync(async (req: Request, res: Response) => {
  const redirectPath =
    typeof req.query.redirect === "string" ? req.query.redirect : "/dashboard";
  const callbackURL = new URL(
    "/api/v1/auth/google/success",
    envVars.BETTER_AUTH_URL,
  );
  callbackURL.searchParams.set("redirect", redirectPath);

  const response = await auth.api.signInSocial({
    body: {
      provider: "google",
      callbackURL: callbackURL.toString(),
    },
    headers: new Headers({
      "user-agent": req.headers["user-agent"] ?? "",
      "x-forwarded-for":
        req.headers["x-forwarded-for"]?.toString() ??
        req.socket.remoteAddress ??
        "",
    }),
    returnHeaders: true,
  });

  const location = response.headers.get("location");

  if (!location) {
    return res.status(500).json({
      success: false,
      message: "Google authorization URL was not generated",
    });
  }

  const setCookie = response.headers.getSetCookie?.();
  if (setCookie?.length) {
    res.setHeader("set-cookie", setCookie);
  }

  return res.redirect(location);
});

/*********************************
 * Reset password
 ********************************/
const googleLoginSuccess = catchAsync(async (req: Request, res: Response) => {
  const redirectPath = req.query.redirect as string || "/dashboard";

  const sessionToken = req.cookies["better-auth.session_token"];

  if (!sessionToken) {
    return res.redirect(`${envVars.FRONTEND_URL}/login?error=oauth_failed`);
  }

  const session = await auth.api.getSession({
    headers: {
      Cookie: `better-auth.session_token=${sessionToken}`,
    },
  });

  if (!session) {
    return res.redirect(`${envVars.FRONTEND_URL}/login?error=no_session_found`);
  }

  const result = await authService.googleLoginSuccess(session);

  const { accessToken, refreshToken } = result;

  tokenUtils.setAccessTokenCookie(res, accessToken);
  tokenUtils.setRefreshTokenCookie(res, refreshToken);
  // ?redirect=//profile -> /profile
  const isValidRedirectPath =
    redirectPath.startsWith("/") && !redirectPath.startsWith("//");
  const finalRedirectPath = isValidRedirectPath ? redirectPath : "/dashboard";

  res.redirect(`${envVars.FRONTEND_URL}${finalRedirectPath}`);
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
  googleLogin,
  googleLoginSuccess,
};
