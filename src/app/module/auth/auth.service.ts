import status from "http-status";
import AppError from "../../errorHelpers/appError";
import { auth } from "../../lib/auth";
import { prisma } from "../../lib/prisma";
import {
  IChangePassword,
  ILoginUserPayload,
  IRegiterPatientPayload,
} from "./auth.interface";
import { UserStatus } from "../../../generated/prisma/enums";
import { tokenUtils } from "../../utils/token";
import { jwtUtils } from "../../utils/jwt";
import { envVars } from "../../config/env";
import { IRequestUser } from "../../interfaces/requestUser.interface";

/**
 *
 * Register patient
 */
const registerPatient = async (payload: IRegiterPatientPayload) => {
  const { name, email, password } = payload;

  const data = await auth.api.signUpEmail({
    body: {
      name,
      email,
      password,
    },
  });

  try {
    const patient = await prisma.$transaction(async (tx) => {
      const patientTx = await tx.patient.create({
        data: {
          userId: data.user.id,
          name: payload.name,
          email: payload.email,
        },
      });

      return patientTx;
    });

    return {
      ...data,
      patient,
    };
  } catch (error) {
    console.log("Transaction error: ", error);
    await prisma.user.delete({
      where: { id: data.user.id },
    });
    throw error;
  }
};

/**
 *
 * User login
 */
const loginUser = async (payload: ILoginUserPayload) => {
  const { email, password } = payload;

  const data = await auth.api.signInEmail({
    body: {
      email,
      password,
    },
  });

  const user = data.user;

  if (user.isDeleted) {
    throw new AppError(status.FORBIDDEN, "This account has been deleted!");
  }
  if (
    user.status === UserStatus.BLOCKED ||
    user.status === UserStatus.DELETED
  ) {
    throw new AppError(
      status.FORBIDDEN,
      `Your account is ${user.status.toLowerCase()}. Please contact support`,
    );
  }

  const accessToken = tokenUtils.getAccessToken({
    sub: user.id,
    role: user.role,
  });
  const refreshToken = tokenUtils.getRefreshToken({
    sub: user.id,
    role: user.role,
  });

  return {
    ...data,
    accessToken,
    refreshToken,
  };
};

/*********************************
 * GET ME
 ********************************/
const getMe = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      doctor: true,
      patient: true,
      admin: true,
    },
  });

  if (!user) {
    throw new AppError(status.NOT_FOUND, "User not found!");
  }

  return user;
};

/*********************************
 * GET NEW TOKEN
 ********************************/
const getNewToken = async (sessionToken: string, refreshToken: string) => {
  const isSessionExists = await prisma.session.findFirst({
    where: {
      token: sessionToken,
    },
    include: {
      user: true,
    },
  });

  if (!isSessionExists) {
    throw new AppError(status.UNAUTHORIZED, "Invalid session token");
  }

  const { token } = await prisma.session.update({
    where: {
      token: sessionToken,
    },
    data: {
      token: sessionToken,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day in milliseconds
      updatedAt: new Date(),
    },
  });

  const verifiedRefreshToken = jwtUtils.verifyToken(
    refreshToken,
    envVars.JWT_REFRESH_SECRET,
  );

  if (!verifiedRefreshToken.success) {
    throw new AppError(status.UNAUTHORIZED, "Invalid refresh token");
  }

  const data = verifiedRefreshToken.data as IRequestUser;

  const newAccessToken = tokenUtils.getAccessToken({
    sub: data.sub,
    role: data.role,
  });
  const newRefreshToken = tokenUtils.getRefreshToken({
    sub: data.sub,
    role: data.role,
  });

  return {
    sessionToken: token,
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
};

/*********************************
 * Change password
 ********************************/
const changePassword = async (
  payload: IChangePassword,
  sessionToken: string,
) => {
  const headers = new Headers({
    Authorization: `Bearer ${sessionToken}`,
  });

  const session = await auth.api.getSession({
    headers,
  });

  if (!session) {
    throw new AppError(status.UNAUTHORIZED, "Invalid session token");
  }

  const result = await auth.api.changePassword({
    body: {
      newPassword: payload.newPassword,
      currentPassword: payload.currentPassword,
      revokeOtherSessions: true,
    },
    headers,
  });

  if (session.user.needPasswordChange) {
    await prisma.user.update({
      where: {
        id: session.user.id,
      },
      data: {
        needPasswordChange: false,
      },
    });
  }

  return result;
};

/*********************************
 * Logout / Sign Out
 ********************************/
const logoutUser = async (sessionToken: string) => {
  const result = await auth.api.signOut({
    headers: new Headers({
      Authorization: `Bearer ${sessionToken}`,
    }),
  });
  return result;
};

/*********************************
 * Verify Email OTP
 ********************************/
const verifyEmailOtp = async (email: string, otp: string) => {
  const result = await auth.api.verifyEmailOTP({
    body: {
      email,
      otp,
    },
  });
  return result;
};

/*********************************
 * Forget password / request reset-password otp
 ********************************/
const forgetPassword = async (email: string) => {
  const user = await prisma.user.findUnique({
    where: { email },
  });
  if (!user) {
    throw new AppError(status.NOT_FOUND, "User not found!");
  }
  if (!user.emailVerified) {
    throw new AppError(status.BAD_REQUEST, "User is not verified!");
  }

  if (user.isDeleted || user.status === UserStatus.DELETED) {
    throw new AppError(status.NOT_FOUND, "User not found");
  }

  const result = await auth.api.requestPasswordResetEmailOTP({
    body: {
      email,
    },
  });
  return result;
};

/*********************************
 * Reset password
 ********************************/
const resetPassword = async (email: string, otp: string, password: string) => {
  const user = await prisma.user.findUnique({
    where: { email },
  });
  if (!user) {
    throw new AppError(status.NOT_FOUND, "User not found!");
  }
  if (!user.emailVerified) {
    throw new AppError(status.BAD_REQUEST, "User is not verified!");
  }

  if (user.isDeleted || user.status === UserStatus.DELETED) {
    throw new AppError(status.NOT_FOUND, "User not found");
  }

  const result = await auth.api.resetPasswordEmailOTP({
    body: {
      email,
      otp,
      password,
    },
  });

  if(user.needPasswordChange){
    await prisma.user.update({
      where: {
        id: user.id
      },
      data: {
        needPasswordChange: false
      }
    })
  }

  await prisma.session.deleteMany({
    where: {
      userId: user.id
    }
  })
  return result;
};

export const authService = {
  registerPatient,
  loginUser,
  getMe,
  getNewToken,
  changePassword,
  logoutUser,
  verifyEmailOtp,
  forgetPassword,
  resetPassword,
};
