import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { checkAuth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { ragController } from "./rag.controller";
import { askQuestionSchema, ingestDocumentSchema } from "./rag.validation";

const router = Router();

router.post(
  "/documents",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  validateRequest(ingestDocumentSchema),
  ragController.addDocument,
);

router.post(
  "/ask",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN, Role.DOCTOR, Role.PATIENT),
  validateRequest(askQuestionSchema),
  ragController.askQuestion,
);

export const RagRoutes = router;