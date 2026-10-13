import status from "http-status";
import { PaymentStatus } from "../../../generated/prisma/enums";
import AppError from "../../errorHelpers/appError";
import { IRequestUser } from "../../interfaces/requestUser.interface";
import { prisma } from "../../lib/prisma";
import { ICreateReviewPayload } from "./review.interface";
import { QueryBuilder } from "../../utils/queryBuilder";
import { IQueryParams } from "../../interfaces/query.interface";

/*********************************
 * Get All Reviews
 ********************************/
const getAllReviews = async (query: IQueryParams) => {
  const queryBuilder = new QueryBuilder(prisma.review, query, {});
  const allReviews = queryBuilder
    .search()
    .paginate()
    .sort()
    .include({
      patient: true,
      doctor: true,
      appointment: true,
    })
    .execute();

  return allReviews;
};

/*********************************
 * Create Reviews
 ********************************/
const createReview = async (
  user: IRequestUser,
  payload: ICreateReviewPayload,
) => {
  const patient = await prisma.patient.findUniqueOrThrow({
    where: { userId: user.sub },
  });

  const { appointmentId, rating, comment } = payload;

  const appointment = await prisma.appointment.findUniqueOrThrow({
    where: { id: appointmentId },
  });

  if (appointment.paymentStatus !== PaymentStatus.PAID) {
    throw new AppError(
      status.BAD_REQUEST,
      "Make payment first to leave a feedback",
    );
  }

  if (appointment.patientId !== patient.id) {
    throw new AppError(
      status.BAD_REQUEST,
      "You can review on your own appointments only.",
    );
  }

  const isReviewed = await prisma.review.findUnique({
    where: { appointmentId },
  });

  if (isReviewed) {
    throw new AppError(
      status.BAD_REQUEST,
      "You already have reviewed this appointment. You can update instead.",
    );
  }

  const result = await prisma.$transaction(async (tx) => {
    const review = await tx.review.create({
      data: {
        patientId: patient.id,
        doctorId: appointment.doctorId,
        appointmentId,
        rating,
        comment,
      },
    });

    const averageRating = await tx.review.aggregate({
      where: { doctorId: appointment.doctorId },
      _avg: {
        rating: true,
      },
    });

    await tx.doctor.update({
      where: { id: appointment.doctorId },
      data: {
        averageRating: averageRating._avg.rating as number,
      },
    });

    return review;
  });

  return result;
};

export const reviewService = {
  getAllReviews,
  createReview,
};
