import { Router } from "express";
import { authController } from "./auth.controller";
import { checkAuth } from "../../middleware/checkAuth";
import { Role } from "../../../generated/prisma/enums";


const router = Router()

router.post("/register", authController.registerPatient)
router.post("/login", authController.loginUser)
router.get("/me", checkAuth(Role.ADMIN, Role.SUPER_AMDIN, Role.DOCTOR, Role.PATIENT), authController.getMe)
router.post("/refresh-token", authController.getNewToken)
router.post("/change-password", checkAuth(Role.ADMIN, Role.SUPER_AMDIN, Role.DOCTOR, Role.PATIENT), authController.changePassword)
router.post("/logout", checkAuth(Role.ADMIN, Role.SUPER_AMDIN, Role.DOCTOR, Role.PATIENT), authController.logoutUser)
router.post("/verify-email", authController.verifyEmailOtp)
router.post("/forget-password", authController.forgetPassword)
router.post("/reset-password", authController.resetPassword)


export const AuthRoutes = router