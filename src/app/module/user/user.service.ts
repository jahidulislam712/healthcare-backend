import status from "http-status";
import AppError from "../../errorHelpers/appError";
import { prisma } from "../../lib/prisma";
import { ICreateAdminPayload, ICreateDoctorPayload } from "./user.interface";
import { auth } from "../../lib/auth";
import { Role } from "../../../generated/prisma/enums";

const createDoctor = async (payload: ICreateDoctorPayload) => {
  /**
   * Check if user does not exist
   */
  const isUserExist = await prisma.user.findUnique({
    where: {
      email: payload.doctor.email,
    },
  });

  if (isUserExist) {
    throw new AppError(status.CONFLICT, "User with this email already exists!");
  }

  /**
   * Check if specialites exist
   */
  const specialties: string[] = [];

  for (const specialtyId of payload.specialties) {
    const specialty = await prisma.specialty.findUnique({
      where: {
        id: specialtyId,
      },
    });

    if (!specialty) {
      throw new AppError(
        status.NOT_FOUND,
        `Specialty with id ${specialtyId} not found`,
      );
    }

    specialties.push(specialtyId);
  }

  /**
   * Register doctor using better-auth
   */
  const userData = await auth.api.signUpEmail({
    body: {
      name: payload.doctor.name,
      email: payload.doctor.email,
      password: payload.password,
      role: Role.DOCTOR,
      needPasswordChange: true,
    },
  });

  /**
   * Create doctor using prisma transaction
   */
  try {
    const result = await prisma.$transaction(async (tx) => {
      const doctorData = await tx.doctor.create({
        data: {
          userId: userData.user.id,
          ...payload.doctor,
        },
      });

      const doctorSpecialtyData = specialties.map((specialty) => {
        return {
          specialtyId: specialty,
          doctorId: doctorData.id,
        };
      });

      await tx.doctorSpecialty.createMany({
        data: doctorSpecialtyData,
      });

      const doctor = await tx.doctor.findUnique({
        where: {
          id: doctorData.id,
        },
        select: {
          id: true,
          userId: true,
          name: true,
          email: true,
          profilePhoto: true,
          contactNumber: true,
          address: true,
          registrationNumber: true,
          experience: true,
          gender: true,
          appointmentFee: true,
          qualification: true,
          currentWorkingPlace: true,
          designation: true,
          createdAt: true,
          updatedAt: true,
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
              status: true,
              emailVerified: true,
              image: true,
              isDeleted: true,
              deletedAt: true,
              createdAt: true,
              updatedAt: true,
            },
          },
          specialties: {
            select: {
              specialty: {
                select: {
                  title: true,
                  id: true,
                },
              },
            },
          },
        },
      });

      return doctor;
    });

    return result;
  } catch (error) {
    console.log("Transaction error", error);
    await prisma.user.delete({
      where: {
        id: userData.user.id,
      },
    });
    throw error;
  }
};

const createAdmin = async (payload: ICreateAdminPayload) => {
  /**
   * Register admin
   */

  const adminData = await auth.api.signUpEmail({
    body: {
      name: payload.admin.name,
      email: payload.admin.email,
      password: payload.password,
      role: payload.role,
      needPasswordChange: true
    },
  });

  try {
    const admin = await prisma.$transaction(async (tx) => {
      await tx.admin.create({
        data: {
          userId: adminData.user.id,
          ...payload.admin,
        },
      });
    });

    return admin;
  } catch (error) {
    await prisma.user.delete({
      where: { id: adminData.user.id },
    });
    throw error;
  }
};

export const userService = {
  createDoctor,
  createAdmin,
};
