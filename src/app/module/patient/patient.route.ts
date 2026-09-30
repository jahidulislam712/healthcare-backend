import { Router } from "express";
import { checkAuth } from "../../middleware/checkAuth";
import { Role } from "../../../generated/prisma/enums";
import { multerUpload } from "../../config/multer.config";
import { updatePatientProfileZodSchema } from "./patient.validation";
import { validateRequest } from "../../middleware/validateRequest";
import { patientController } from "./patient.controller";

const router = Router();

router.patch(
  "/update-my-profile",
  checkAuth(Role.PATIENT),
  multerUpload.fields([
    { name: "profilePhoto", maxCount: 1 },
    { name: "medicalReports", maxCount: 5 },
  ]),
  validateRequest(updatePatientProfileZodSchema),
  patientController.updatePatientprofile,
);

export const PatientRoutes = router;
