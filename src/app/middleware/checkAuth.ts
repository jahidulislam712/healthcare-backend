import { NextFunction, Request, Response, RequestHandler } from "express";
import { Role, UserStatus } from "../../generated/prisma/enums";
import { cookieUtils } from "../utils/cookie";
import AppError from "../errorHelpers/appError";
import status from "http-status";
import { prisma } from "../lib/prisma";
import { AppTokenClaims, jwtUtils } from "../utils/jwt";
import { SESSION_POLICY } from "../config/sessionPolicy";

export const checkAuth =
  (...roles: Role[]): RequestHandler =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accessToken = cookieUtils.getCookie(req, "accessToken");
      if (!accessToken) {
        throw new AppError(status.UNAUTHORIZED, "Please login.");
      }

      const verified = jwtUtils.verifyAccessToken(accessToken);
      if (!verified.success || typeof verified.data === "string") {
        throw new AppError(
          status.UNAUTHORIZED,
          "Invalid or expired access token.",
        );
      }

      const claims = verified.data as AppTokenClaims;
      if (
        claims.purpose !== "access" ||
        typeof claims.sub !== "string" ||
        typeof claims.sid !== "string"
      ) {
        throw new AppError(status.UNAUTHORIZED, "Invalid access token.");
      }

      const now = new Date();
      const idleCutoff = new Date(now.getTime() - SESSION_POLICY.idleTimeoutMs);
      const absoluteCutoff = new Date(
        now.getTime() - SESSION_POLICY.absoluteTimeoutMs,
      );

      const session = await prisma.session.findFirst({
        where: {
          id: claims.sid,
          userId: claims.sub,
          expiresAt: { gt: new Date() },
          lastActivityAt: { gt: idleCutoff },
          createdAt: { gt: absoluteCutoff },
        },
        select: {
          id: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              role: true,
              status: true,
              isDeleted: true,
            },
          },
        },
      });

      if (!session) {
        throw new AppError(
          status.UNAUTHORIZED,
          "Session is nnvalid or expired. Please sign-in again",
        );
      }

      const user = session.user;
      if (
        user.isDeleted ||
        user.status === UserStatus.BLOCKED ||
        user.status === UserStatus.DELETED
      ) {
        throw new AppError(
          status.FORBIDDEN,
          "This account cannot access the application.",
        );
      }

      if (roles.length > 0 && !roles.includes(user.role)) {
        throw new AppError(
          status.FORBIDDEN,
          "You do not have permission to access this resource.",
        );
      }

      const absoluteExpiresAt = new Date(
        session.createdAt.getTime() + SESSION_POLICY.absoluteTimeoutMs,
      );

      const renewedExpiresAt = new Date(
        Math.min(
          now.getTime() + SESSION_POLICY.idleTimeoutMs,
          absoluteExpiresAt.getTime(),
        ),
      );

      const activityUpdate = await prisma.session.updateMany({
        where: {
          id: session.id,
          expiresAt: { gt: now },
          lastActivityAt: { gt: idleCutoff },
          createdAt: { gt: absoluteCutoff },
        },
        data: { lastActivityAt: now, expiresAt: renewedExpiresAt },
      });

      if (activityUpdate.count !== 1) {
        throw new AppError(
          status.UNAUTHORIZED,
          "Session expired. Please sign in again.",
        );
      }

      req.user = {
        sub: user.id,
        role: user.role,
      };

      next();
    } catch (error) {
      next(error);
    }
  };
