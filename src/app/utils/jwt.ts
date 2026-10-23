/* eslint-disable @typescript-eslint/no-explicit-any */
import { JWTPayload } from "better-auth";
import jwt from "jsonwebtoken";
import { Role } from "../../generated/prisma/enums";
import { envVars } from "../config/env";

// const createToken = (
//   payload: IRequestUser,
//   secret: string,
//   expiresIn: string,
// ) => {
//   return jwt.sign(payload, secret, {
//     expiresIn,
//   } as SignOptions);
// };

// const verifyToken = (token: string, secret: string) => {
//   try {
//     const verifiedToken = jwt.verify(token, secret)
//     return {
//       success: true,
//       data: verifiedToken,
//     };
//   } catch (error: any) {
//     return {
//       success: false,
//       message: error.emssage,
//       error,
//     };
//   }
// };
const issuer = "healthCare-api";
const audience = "healthCare-app";

export type AppTokenPurpose = "access" | "refresh";

export interface AppTokenClaims extends JWTPayload {
  sub: string;
  role: Role;
  sid: string;
  purpose: AppTokenPurpose;
  jti?: string;
}

const signToken = (
  claims: AppTokenClaims,
  secret: string,
  expiresIn: number,
) => {
  return jwt.sign(claims, secret, {
    expiresIn,
    algorithm: "HS256",
    issuer,
    audience,
  });
};

const verifyToken = (token: string, secret: string) => {
  try {
    return {
      success: true,
      data: jwt.verify(token, secret, {
        algorithms: ["HS256"],
        audience,
        issuer,
      }),
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message,
    };
  }
};

export const jwtUtils = {
  signToken,
  verifyAccessToken: (token: string) =>
    verifyToken(token, envVars.JWT_ACCESS_SECRET),
  verifyRefreshToken: (token: string) =>
    verifyToken(token, envVars.JWT_REFRESH_SECRET),
};
