import { NextFunction, Request, Response } from "express";
import { status } from "http-status";
import { envVars } from "../config/env";
import { ZodError } from "zod";
import { Prisma } from "../../generated/prisma/client";
import AppError from "../errorHelpers/appError";
import { isAPIError } from "better-auth/api";

export interface IErrorSource {
  path: string;
  message: string;
}

const internalServerErrorMessage = "Internal server error";

export const globalErrorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  if (res.headersSent) {
    _next(err);
    return;
  }

  let statusCode: number = status.INTERNAL_SERVER_ERROR;
  let message = internalServerErrorMessage;
  let errorCode: string | undefined;
  let errorSources: IErrorSource[] = [
    { path: "", message: internalServerErrorMessage },
  ];

  if (err instanceof ZodError) {
    statusCode = status.BAD_REQUEST;
    message = "Validation Error";
    errorSources = err.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
    }));
    errorSources = errorSources.length
      ? errorSources
      : [{ path: "", message: "Invalid request data." }];
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case "P2000":
      case "P2006":
      case "P2011":
      case "P2012":
      case "P2014":
      case "P2019":
      case "P2020":
        statusCode = status.BAD_REQUEST;
        message = "Invalid data provided.";
        errorSources = [{ path: "", message }];
        break;
      case "P2001":
      case "P2025":
        statusCode = status.NOT_FOUND;
        message = "Record not found.";
        errorSources = [{ path: "", message }];
        break;
      case "P2002": {
        statusCode = status.CONFLICT;
        const target = err.meta?.target;
        let path = Array.isArray(target)
          ? target.join(".")
          : typeof target === "string"
            ? target
            : "";
        // Fallback for Prisma driver adapters
        if (!path) {
          const driverError = err.meta?.driverAdapterError as
            | {
                cause?: {
                  originalMessage?: string;
                };
              }
            | undefined;

          const originalMessage = driverError?.cause?.originalMessage ?? "";

          const match = originalMessage.match(/unique constraint "([^"]+)"/i);

          const constraint = match?.[1];

          if (constraint) {
            path = constraint.replace(/_key$/, "").replace(/^.*_/, "");
          }
        }
        message = path
          ? `${path} already exists.`
          : "A record with this value already exists.";
        errorSources = [{ path, message }];
        break;
      }
      case "P2003": {
        statusCode = status.BAD_REQUEST;
        message = "The related record does not exist or cannot be changed.";
        const fieldName = err.meta?.field_name;
        errorSources = [
          {
            path: typeof fieldName === "string" ? fieldName : "",
            message,
          },
        ];
        break;
      }
      case "P2024":
        statusCode = status.SERVICE_UNAVAILABLE;
        message = "Database is temporarily unavailable.";
        errorSources = [{ path: "", message }];
        break;
      case "P2034":
        statusCode = status.CONFLICT;
        message =
          "The operation conflicted with another transaction. Please retry.";
        errorSources = [{ path: "", message }];
        break;
    }
  } else if (err instanceof Prisma.PrismaClientInitializationError) {
    statusCode = status.SERVICE_UNAVAILABLE;
    message = "Database is temporarily unavailable.";
    errorSources = [{ path: "", message }];
  } else if (isAPIError(err)) {
    statusCode = err.statusCode;
    message =
      statusCode >= status.INTERNAL_SERVER_ERROR
        ? internalServerErrorMessage
        : err.message;
    errorCode = typeof err.body?.code === "string" ? err.body.code : undefined;
    errorSources = [{ path: "", message }];
  } else if (err instanceof AppError) {
    statusCode = err.statusCode;
    message =
      statusCode >= status.INTERNAL_SERVER_ERROR
        ? internalServerErrorMessage
        : err.message;
    errorSources = [{ path: "", message }];
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(errorCode ? { code: errorCode } : {}),
    errorSources,
    err: envVars.NODE_ENV === "development" ? err : null,
    stack:
      envVars.NODE_ENV === "development" && err instanceof Error
        ? err.stack
        : null,
  });
};
