import { Request, Response } from "express";
import status from "http-status";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { askAI, ingestDocument } from "./rag.service";

const addDocument = catchAsync(async (req: Request, res: Response) => {
  const result = await ingestDocument(req.body.source, req.body.text);

  sendResponse(res, {
    success: true,
    message: "Document added successfully.",
    statusCode: status.CREATED,
    data: result,
  });
});

const askQuestion = catchAsync(async (req: Request, res: Response) => {
  const result = await askAI(req.body.question);

  sendResponse(res, {
    success: true,
    message: "Answer generated successfully.",
    statusCode: status.OK,
    data: result,
  });
});

export const ragController = {
  addDocument,
  askQuestion,
};
