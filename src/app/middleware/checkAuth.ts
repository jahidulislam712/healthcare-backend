import { NextFunction, Request, Response, RequestHandler } from "express";
import { Role, UserStatus } from "../../generated/prisma/enums";
import { cookieUtils } from "../utils/cookie";
import AppError from "../errorHelpers/appError";
import status from "http-status";
import { prisma } from "../lib/prisma";
import { jwtUtils } from "../utils/jwt";
import { envVars } from "../config/env";

export const checkAuth =
  (...roles: Role[]): RequestHandler =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // verify session token
      const sessionToken = cookieUtils.getCookie(
        req,
        "better-auth.session_token",
      );
      if (!sessionToken) {
        throw new AppError(
          status.UNAUTHORIZED,
          "Unauthorized access! No access token found.",
        );
      }

      const sessionExists = await prisma.session.findFirst({
        where: {
          token: sessionToken,
          expiresAt: {
            gt: new Date(),
          },
        },
        include: {
          user: true,
        },
      });

      if (!sessionExists) {
        throw new AppError(
          status.UNAUTHORIZED,
          "Unauthorized access! No access token found.",
        );
      }

      if (sessionExists && sessionExists.user) {
        const user = sessionExists.user;


        if (user.isDeleted) {
          throw new AppError(
            status.UNAUTHORIZED,
            "Unauthorized access! User is deleted.",
          );
        }

        if (
          user.status === UserStatus.BLOCKED ||
          user.status === UserStatus.DELETED
        ) {
          throw new AppError(
            status.UNAUTHORIZED,
            "Unauthorized access! User is not active.",
          );
        }

        if (!roles.includes(user.role)) {
          throw new AppError(
            status.FORBIDDEN,
            "Forbidden access! You do not have permission to access this resource.",
          );
        }

        req.user = {
          sub: user.id,
          role: user.role,
        };
      }

      // verify access token
      const accessToken = cookieUtils.getCookie(req, "accessToken");
      if (!accessToken) {
        throw new AppError(
          status.UNAUTHORIZED,
          "Unauthorized access! No access token provided.",
        );
      }

      const verifyToken = jwtUtils.verifyToken(
        accessToken,
        envVars.JWT_ACCESS_SECRET,
      );
      if (!verifyToken.success) {
        throw new AppError(
          status.UNAUTHORIZED,
          "Unauthorized access! Invalid access token.",
        );
      }

      const userId = verifyToken.data?.sub as string;
      const isUserExists = await prisma.user.findFirst({
        where: { id: userId },
      });
      if (!isUserExists) {
        throw new AppError(
          status.UNAUTHORIZED,
          "Unauthorized access! User not found.",
        );
      }

      if (isUserExists.isDeleted) {
        throw new AppError(
          status.UNAUTHORIZED,
          "Unauthorized access! User is deleted.",
        );
      }

      if (
        isUserExists.status === UserStatus.BLOCKED ||
        isUserExists.status === UserStatus.DELETED
      ) {
        throw new AppError(
          status.UNAUTHORIZED,
          "Unauthorized access! User is not active.",
        );
      }
      if (!roles.includes(isUserExists.role)) {
        throw new AppError(
          status.FORBIDDEN,
          "Forbidden access! You do not have permission to access this resource.",
        );
      }

      next()
    } catch (error) {
      next(error);
    }
  };
