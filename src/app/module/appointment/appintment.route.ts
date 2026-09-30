import { Router } from "express";
import { appointmentController } from "./appintment.controller";
import { checkAuth } from "../../middleware/checkAuth";
import { Role } from "../../../generated/prisma/enums";

const router = Router()

router.post("/book-appointment", checkAuth(Role.PATIENT, Role.DOCTOR), appointmentController.bookAppointment)

export const AppointmentRoutes = router