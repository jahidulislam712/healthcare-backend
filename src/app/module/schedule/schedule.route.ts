import { Router } from "express";
import { scheduleController } from "./schedule.controller";

const router = Router()

router.post("/", scheduleController.createSchedule)
router.get("/", scheduleController.getAllSchedule)
router.patch("/:id", scheduleController.updateSchedule)

export const ScheduleRoutes = router