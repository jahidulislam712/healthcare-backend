import { Router } from "express"
import { SpecialtyRoutes } from "../module/specialty/specialty.route"
import { AuthRoutes } from "../module/auth/auth.route"
import { UserRoutes } from "../module/user/user.route"
import { DoctorRoutes } from "../module/doctor/doctor.route"
import { ScheduleRoutes } from "../module/schedule/schedule.route"
import { DoctorScheduleRoutes } from "../module/doctorSchedule/doctorSchedule.route"
import { AppointmentRoutes } from "../module/appointment/appintment.route"
import { PatientRoutes } from "../module/patient/patient.route"


export const router = Router()

const moduleRoutes = [
  {
    path: "/auth",
    route: AuthRoutes
  },
  {
    path: "/specialties",
    route: SpecialtyRoutes
  },
  {
    path: "/users",
    route: UserRoutes
  },
  {
    path: "/doctors",
    route: DoctorRoutes
  },
  {
    path: "/schedules",
    route: ScheduleRoutes
  },
  {
    path: "/doctor-schedules",
    route: DoctorScheduleRoutes
  },
  {
    path: "/appointments",
    route: AppointmentRoutes
  },
  {
    path: "/patients",
    route: PatientRoutes
  },
]

moduleRoutes.forEach(route => {
  router.use(route.path, route.route)
})

export const IndexRoutes = router;