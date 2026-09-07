import { Response } from "express";
import { envVars } from "../config/env";
import { IRequestUser } from "../interfaces/requestUser.interface";
import { cookieUtils } from "./cookie";
import { jwtUtils } from "./jwt";

const getAccessToken = (payload: IRequestUser) => {
  const accessToken = jwtUtils.createToken(
    payload,
    envVars.JWT_ACCESS_SECRET,
    envVars.JWT_ACCESS_EXPIRES,
  );

  return accessToken;
};

const getRefreshToken = (payload: IRequestUser) => {
  const refreshToken = jwtUtils.createToken(
    payload,
    envVars.JWT_REFRESH_SECRET,
    envVars.JWT_REFRESH_EXPIRES,
  );

  return refreshToken
};

const setAccessTokenCookie = (res: Response, token: string) => {
  cookieUtils.setCookie(res, 'accessToken', token, {
    httpOnly: true,
    secure: false,
    sameSite: "none",
    path: "/",
    maxAge: 60 * 60 * 1000 // 1 hour
  })
}

const setRefreshTokenCookie = (res: Response, token: string) => {
  cookieUtils.setCookie(res, 'refreshToken', token, {
    httpOnly: true,
    secure: false,
    sameSite: "none",
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  })
}

const setBetterAuthSessionCookie = (res: Response, token: string) => {
  cookieUtils.setCookie(res, 'better-auth.session_token', token, {
    httpOnly: true,
    secure: false,
    sameSite: "none",
    path: "/",
    maxAge: 60 * 60 * 1000 // 1 hour
  })
}

export const tokenUtils = {
  getAccessToken,
  getRefreshToken,
  setAccessTokenCookie,
  setRefreshTokenCookie,
  setBetterAuthSessionCookie
};
