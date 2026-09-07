/* eslint-disable @typescript-eslint/no-explicit-any */
import jwt, { SignOptions } from "jsonwebtoken";
import { IRequestUser } from "../interfaces/requestUser.interface";

const createToken = (
  payload: IRequestUser,
  secret: string,
  expiresIn: string,
) => {
  return jwt.sign(payload, secret, {
    expiresIn,
  } as SignOptions);
};

const verifyToken = (token: string, secret: string) => {
  try {
    const verifiedToken = jwt.verify(token, secret)
    return {
      success: true,
      data: verifiedToken,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.emssage,
      error,
    };
  }
};

export const jwtUtils = {
  createToken,
  verifyToken,
};
