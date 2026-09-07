import { NextFunction, Request, Response } from "express";
import { status } from "http-status";
import { envVars } from "../config/env";
import { ZodError } from "zod";

export interface IErrorSource {
  path: string;
  message: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
export const globalErrorHandler = ( err: any, req: Request, res: Response, next: NextFunction,
) => {
  let statusCode = err.statusCode || status.INTERNAL_SERVER_ERROR;
  let message = err.message || "Internal server error";
  let errorSources: IErrorSource[] = [
    {
      path: "",
      message: err?.message || "Something went wrong!!",
    },
  ];

  // 1. Handle Zod Validation Error
  if (err instanceof ZodError) {
    statusCode = status.BAD_REQUEST;
    message = "Validation Error";
    errorSources = err.issues.map((issue) => ({
      path: (issue.path[issue.path.length - 1] as string) || "",
      message: issue.message,
    }));
  }

  // 2. Handle Mongoose Duplicate Key Error (E11000)
  else if (err?.code === 11000) {
    statusCode = status.CONFLICT;
    message = "Duplicate Entry";
    const matched = err.message.match(/"([^"]*)"/);
    const value = matched ? matched[1] : "";
    errorSources = [
      {
        path: "",
        message: `${value} already exists in the system`,
      },
    ];
  }

  // 3. Handle Mongoose CastError (Invalid MongoDB ObjectId)
  else if (err?.name === "CastError") {
    statusCode = status.BAD_REQUEST;
    message = "Invalid ID Format";
    errorSources = [
      {
        path: err.path,
        message: `${err.value} is not a valid ID`,
      },
    ];
  }

  res.status(statusCode).json({
    success: false,
    message,
    errorSources,
    err: envVars.NODE_ENV === "development" ? err : null,
    stack: envVars.NODE_ENV === "development" ? err.stack : null,
  });
};
