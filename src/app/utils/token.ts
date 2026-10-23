import { Response } from "express";
import { envVars } from "../config/env";
import { cookieUtils } from "./cookie";
import { SESSION_POLICY } from "../config/sessionPolicy";

const commonCookieOptions = {
  httpOnly: true,
  secure: envVars.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

const setAccessTokenCookie = (res: Response, token: string) => {
  cookieUtils.setCookie(res, "accessToken", token, {
    ...commonCookieOptions,
    maxAge: SESSION_POLICY.accessTokenCookieMaxAgeMs,
  });
};

const setRefreshTokenCookie = (res: Response, token: string) => {
  cookieUtils.setCookie(res, "refreshToken", token, {
    ...commonCookieOptions,
    maxAge: SESSION_POLICY.refreshTokenCookieMaxAgeMs,
  });
};

const setBetterAuthSessionCookie = (res: Response, token: string) => {
  cookieUtils.setCookie(res, "better-auth.session_token", token, {
    ...commonCookieOptions,
    maxAge: SESSION_POLICY.refreshTokenCookieMaxAgeMs,
  });
};

const clearAuthCookies = (res: Response) => {
  for (const name of [
    "accessToken",
    "refreshToken",
    "better-auth.session_token",
  ]) {
    cookieUtils.clearCookie(res, name, {
      httpOnly: true,
      secure: envVars.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });
  }
};

export const tokenUtils = {
  setAccessTokenCookie,
  setRefreshTokenCookie,
  setBetterAuthSessionCookie,
  clearAuthCookies
};
