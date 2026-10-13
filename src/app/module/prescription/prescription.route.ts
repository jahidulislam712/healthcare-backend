import { Router } from "express";
import { checkAuth } from "../../middleware/checkAuth";
import { Role } from "../../../generated/prisma/enums";
import { prescriptionController } from "./prescription.controller";

const router = Router();

router.get(
  "/medicines/search",
  checkAuth(Role.DOCTOR),
  prescriptionController.searchMedicines,
);
router.get(
  "/medicines/:medicineId",
  checkAuth(Role.DOCTOR),
  prescriptionController.getMedicineDetails,
);
router.get(
  "/",
  checkAuth(Role.ADMIN, Role.SUPER_AMDIN, Role.DOCTOR, Role.PATIENT),
  prescriptionController.getAllPrescriptions,
);
router.post(
  "/",
  checkAuth(Role.DOCTOR),
  prescriptionController.createPrescription,
);
router.patch(
  "/:prescriptionId",
  checkAuth(Role.DOCTOR),
  prescriptionController.updatePrescription,
);

export const PrescriptionRoutes = router;
