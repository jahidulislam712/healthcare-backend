import { Router } from "express";
import { specialtyController } from "./specialty.controller";
import { checkAuth } from "../../middleware/checkAuth";
import { Role } from "../../../generated/prisma/enums";

const router = Router();

router.post(
  "/",
  checkAuth(Role.ADMIN, Role.SUPER_AMDIN),
  specialtyController.createSpecialty,
);
router.get("/", specialtyController.getAllSpecialties);
router.delete(
  "/:id",
  checkAuth(Role.ADMIN, Role.SUPER_AMDIN),
  specialtyController.deleteSpecialty,
);

export const SpecialtyRoutes = router;
