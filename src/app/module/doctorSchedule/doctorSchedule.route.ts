import { Router } from "express";
import { doctorScheduleController } from "./doctorSchedule.controller";
import { checkAuth } from "../../middleware/checkAuth";
import { Role } from "../../../generated/prisma/enums";

const router = Router()

router.post("/create-my-doctor-schedule", checkAuth(Role.DOCTOR), doctorScheduleController.createDoctorSchedule)
router.get("/my-doctor-schedules", checkAuth(Role.DOCTOR), doctorScheduleController.getMyDoctorSchedule)
router.get("", doctorScheduleController.getAllDoctorSchedules)
router.patch("/update-my-doctor-schedule", checkAuth(Role.DOCTOR), doctorScheduleController.updateMyDoctorSchedule)

export const DoctorScheduleRoutes = router