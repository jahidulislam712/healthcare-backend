import { CookieOptions, Request, Response } from "express";

const setCookie = (
  res: Response,
  name: string,
  val: string,
  options: CookieOptions,
) => {
  res.cookie(name, val, options);
};

const getCookie = (req: Request, name: string) => {
  return req.cookies[name];
};

const clearCookie = (res: Response, key: string, options: CookieOptions) => {
  res.clearCookie(key, options);
};

export const cookieUtils = {
  setCookie,
  getCookie,
  clearCookie,
};
