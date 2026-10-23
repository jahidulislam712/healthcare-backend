import { Router } from "express";
import { authController } from "./auth.controller";
import { checkAuth } from "../../middleware/checkAuth";
import { Role } from "../../../generated/prisma/enums";
import { validateRequest } from "../../middleware/validateRequest";
import { forgetPasswordZodSchema, resetPasswordZodSchema } from "./auth.validation";


const router = Router()

router.post("/register", authController.registerPatient)
router.post("/login", authController.loginUser)
router.get("/me", checkAuth(Role.ADMIN, Role.SUPER_ADMIN, Role.DOCTOR, Role.PATIENT), authController.getMe)
router.post("/refresh-token", authController.getNewToken)
router.post("/change-password", checkAuth(Role.ADMIN, Role.SUPER_ADMIN, Role.DOCTOR, Role.PATIENT), authController.changePassword)
router.post("/logout", authController.logoutUser)
router.post("/verify-email", authController.verifyEmailOtp)
router.post("/forget-password",
  validateRequest(forgetPasswordZodSchema),
  authController.forgetPassword)
router.post("/reset-password",
  validateRequest(resetPasswordZodSchema),
  authController.resetPassword)

router.get("/login/google", authController.googleLogin)
router.get("/google/success", authController.googleLoginSuccess)


export const AuthRoutes = router