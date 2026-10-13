import { Router } from "express";
import { validateRequest } from "../../middleware/validateRequest";
import { createReviewZodSchema } from "./review.validation";
import { checkAuth } from "../../middleware/checkAuth";
import { Role } from "../../../generated/prisma/enums";
import { reviewController } from "./review.controller";

const router = Router();

router.get("/", reviewController.getAllReviews);
router.post(
  "/",
  checkAuth(Role.PATIENT),
  validateRequest(createReviewZodSchema),
  reviewController.createReview,
);

export const ReviewRoutes = router;
