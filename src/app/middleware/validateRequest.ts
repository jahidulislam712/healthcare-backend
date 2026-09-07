import { NextFunction, Request, Response } from "express";
import { ZodType } from "zod";

export const validateRequest =
  (zodSchema: ZodType) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if ((req.file || req.files) && typeof req.body.data === "string") {
        try {
          req.body = JSON.parse(req.body.data);
        } catch (error) {
          return next(
            new Error("Invalid JSON in 'data' field", {
              cause: error,
            }),
          );
        }
      }
      req.body = await zodSchema.parseAsync(req.body);
      next();
    } catch (err) {
      next(err);
    }
  };
