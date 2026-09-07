import { Router } from "express"
import { doctorController } from "./doctor.controller"
import { checkAuth } from "../../middleware/checkAuth"
import { Role } from "../../../generated/prisma/enums"

const router = Router()

router.get("/", doctorController.getAllDoctors)
router.post("/:id", checkAuth(Role.ADMIN, Role.SUPER_AMDIN), doctorController.getDoctorById)

export const DoctorRoutes = router