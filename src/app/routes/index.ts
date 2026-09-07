import { Router } from "express"
import { SpecialtyRoutes } from "../module/specialty/specialty.route"
import { AuthRoutes } from "../module/auth/auth.route"
import { UserRoutes } from "../module/user/user.route"
import { DoctorRoutes } from "../module/doctor/doctor.route"


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
]

moduleRoutes.forEach(route => {
  router.use(route.path, route.route)
})

export const IndexRoutes = router;