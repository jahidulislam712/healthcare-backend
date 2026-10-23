import status from "http-status";
import AppError from "../../errorHelpers/appError";
import { auth } from "../../lib/auth";
import { prisma } from "../../lib/prisma";
import {
  IChangePassword,
  ILoginUserPayload,
  IRegiterPatientPayload,
} from "./auth.interface";
import { Role, UserStatus } from "../../../generated/prisma/enums";
import { AppTokenClaims, jwtUtils } from "../../utils/jwt";
import { randomUUID } from "node:crypto";
import { SESSION_POLICY } from "../../config/sessionPolicy";
import { envVars } from "../../config/env";

/**
 *
 * Register patient
 */
const registerPatient = async (payload: IRegiterPatientPayload) => {
  const { name, email, password } = payload;

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new AppError(status.CONFLICT, `User already exists with this email.`);
  }

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

  const isUser = await prisma.user.findUnique({
    where: { email },
    include: { accounts: true },
  });
  if (!isUser) {
    throw new AppError(status.UNAUTHORIZED, "Invalid email or password");
  }

  // check oAuth provider
  const hasPassword = isUser.accounts.find((acc) => acc.password !== null);

  if (!hasPassword) {
    const providerId = isUser.accounts[0].providerId || "a social provider";
    throw new AppError(
      status.UNAUTHORIZED,
      `This account uses ${providerId} Sign-in. Please log in with ${providerId} or use Forgot Password to create one`,
    );
  }

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

  const session = await prisma.session.findUnique({
    where: {
      token: data.token,
      userId: data.user.id,
      expiresAt: { gt: new Date() },
    },
  });

  if (!session) {
    throw new AppError(status.UNAUTHORIZED, "Login session was not created.");
  }

  const refreshTokenId = randomUUID();

  await prisma.session.update({
    where: { id: session.id },
    data: { refreshTokenId, lastActivityAt: new Date() },
  });

  const accessToken = jwtUtils.signToken(
    {
      sub: user.id,
      role: user.role as Role,
      sid: session.id,
      purpose: "access",
    },
    envVars.JWT_ACCESS_SECRET,
    SESSION_POLICY.accessTokenExpiresInSeconds,
  );

  const refreshToken = jwtUtils.signToken(
    {
      sub: user.id,
      role: user.role as Role,
      sid: session.id,
      purpose: "refresh",
      jti: refreshTokenId,
    },
    envVars.JWT_REFRESH_SECRET,
    SESSION_POLICY.refreshTokenExpiresInSeconds,
  );

  // const accessToken = tokenUtils.getAccessToken({
  //   sub: user.id,
  //   role: user.role,
  // });
  // const refreshToken = tokenUtils.getRefreshToken({
  //   sub: user.id,
  //   role: user.role,
  // });

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
  if (!sessionToken || !refreshToken) {
    throw new AppError(status.UNAUTHORIZED, "Refresh credentials are missing");
  }

  const verified = jwtUtils.verifyRefreshToken(refreshToken);

  if (!verified.success || typeof verified.data === "string") {
    throw new AppError(status.UNAUTHORIZED, "Invalid or expire refresh token");
  }

  const claims = verified.data as AppTokenClaims;

  if (
    claims.purpose !== "refresh" ||
    typeof claims.sub !== "string" ||
    typeof claims.sid !== "string" ||
    typeof claims.jti !== "string"
  ) {
    throw new AppError(status.UNAUTHORIZED, "Invalid refresh token.");
  }

  const now = new Date();
  const idleCutoff = new Date(now.getTime() - SESSION_POLICY.idleTimeoutMs);
  const absoluteCutoff = new Date(
    now.getTime() - SESSION_POLICY.absoluteTimeoutMs,
  );
  const session = await prisma.session.findFirst({
    where: {
      id: claims.sid,
      token: sessionToken,
      userId: claims.sub,
      refreshTokenId: claims.jti,
      expiresAt: { gt: new Date() },
      lastActivityAt: { gt: idleCutoff },
      createdAt: { gt: absoluteCutoff },
    },
    select: {
      id: true,
      token: true,
      createdAt: true,
      user: {
        select: {
          id: true,
          role: true,
          status: true,
          isDeleted: true,
        },
      },
    },
  });

  if (!session) {
    throw new AppError(
      status.UNAUTHORIZED,
      "Session or refresh token is invalid.",
    );
  }

  const user = session.user;

  if (
    user.isDeleted ||
    user.status === UserStatus.BLOCKED ||
    user.status === UserStatus.DELETED
  ) {
    throw new AppError(
      status.FORBIDDEN,
      "This account cannot access the application.",
    );
  }

  const nextRefreshTokenId = randomUUID();

  const accessToken = jwtUtils.signToken(
    {
      purpose: "access",
      role: user.role as Role,
      sid: session.id,
      sub: user.id,
    },
    envVars.JWT_ACCESS_SECRET,
    SESSION_POLICY.accessTokenExpiresInSeconds,
  );

  const newRefreshToken = jwtUtils.signToken(
    {
      purpose: "refresh",
      role: user.role as Role,
      sid: session.id,
      sub: user.id,
      jti: nextRefreshTokenId,
    },
    envVars.JWT_REFRESH_SECRET,
    SESSION_POLICY.refreshTokenExpiresInSeconds,
  );

  const absoluteExpiresAt = new Date(
    session.createdAt.getTime() + SESSION_POLICY.absoluteTimeoutMs,
  );
  const renewedExpiresAt = new Date(
    Math.min(
      now.getTime() + SESSION_POLICY.idleTimeoutMs,
      absoluteExpiresAt.getTime(),
    ),
  );

  // atomic one-time rotation: concurrent reuse of the old refresh token loses.
  const rotation = await prisma.session.updateMany({
    where: {
      id: session.id,
      token: sessionToken,
      refreshTokenId: claims.jti,
      expiresAt: { gt: new Date() },
      lastActivityAt: { gt: idleCutoff },
      createdAt: { gt: absoluteCutoff },
    },
    data: {
      refreshTokenId: nextRefreshTokenId,
      lastActivityAt: now,
      expiresAt: renewedExpiresAt,
    },
  });

  if (rotation.count !== 1) {
    throw new AppError(
      status.UNAUTHORIZED,
      "Refresh token has already been used or the session expired.",
    );
  }

  return {
    sessionToken: session.token,
    accessToken,
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
const logoutUser = async (sessionToken?: string) => {
  if (!sessionToken) return;

  await prisma.session.deleteMany({
    where: {
      token: sessionToken,
    },
  });

  // const result = await auth.api.signOut({
  //   headers: new Headers({
  //     Authorization: `Bearer ${sessionToken}`,
  //   }),
  // });
  // return result;
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
  const canResetPassword =
    user !== null &&
    user.emailVerified &&
    !user.isDeleted &&
    user.status !== UserStatus.BLOCKED &&
    user.status !== UserStatus.DELETED;

  if (!canResetPassword) return;

  await auth.api.requestPasswordResetEmailOTP({
    body: {
      email,
    },
  });
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

  if (user.needPasswordChange) {
    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        needPasswordChange: false,
      },
    });
  }

  await prisma.session.deleteMany({
    where: {
      userId: user.id,
    },
  });
  return result;
};

/*********************************
 * Google Login Success
 ********************************/
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const googleLoginSuccess = async (session: Record<string, any>) => {
  const isPatientExists = await prisma.patient.findUnique({
    where: {
      userId: session.user.id,
    },
  });

  if (!isPatientExists) {
    await prisma.patient.create({
      data: {
        userId: session.user.id,
        name: session.user.name,
        email: session.user.email,
      },
    });
  }

  const accessToken = jwtUtils.signToken(
    {
      sub: session.userId,
      role: session.user.role as Role,
      sid: session.id,
      purpose: "access",
    },
    envVars.JWT_ACCESS_SECRET,
    SESSION_POLICY.accessTokenExpiresInSeconds,
  );

  const refreshToken = jwtUtils.signToken(
    {
      sub: session.userId,
      role: session.user.role as Role,
      sid: session.id,
      purpose: "refresh",
    },
    envVars.JWT_REFRESH_SECRET,
    SESSION_POLICY.refreshTokenExpiresInSeconds,
  );

  return {
    accessToken,
    refreshToken,
  };
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
  googleLoginSuccess,
};
