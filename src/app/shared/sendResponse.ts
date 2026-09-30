import { Response } from "express";

interface TResponse<T> {
  statusCode: number;
  message: string;
  success: boolean;
  data?: T;
  meta?:Record<string, unknown>
}
export const sendResponse = <T>(res: Response, payload: TResponse<T>) => {
  res.status(payload.statusCode).json({
    success: payload.success,
    message: payload.message,
    data: payload.data,
    meta: payload.meta
  });
};
