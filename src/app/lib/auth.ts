import { betterAuth } from "better-auth";
import { prisma } from "./prisma";
import { prismaAdapter } from "@better-auth/prisma-adapter";
import { Role, UserStatus } from "../../generated/prisma/enums";
import { envVars } from "../config/env";
import { bearer, emailOTP } from "better-auth/plugins";
import { sendEmail } from "../services/email/sendEmail";

export const auth = betterAuth({
  baseURL: envVars.BETTER_AUTH_URL,
  secret: envVars.BETTER_AUTH_SECRET,
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
  },
  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: true,
    autoSignInAfterVerification: true,
  },
  socialProviders: {
    google: {
      clientId: envVars.GOOGLE_CLIENT_ID,
      clientSecret: envVars.GOOGLE_CLIENT_SECRET
    }
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: true,
        defaultValue: Role.PATIENT,
      },
      status: {
        type: "string",
        required: true,
        defaultValue: UserStatus.ACTIVE,
      },
      needPasswordChange: {
        type: "boolean",
        required: true,
        defaultValue: false,
      },
      isDeleted: {
        type: "boolean",
        required: true,
        defaultValue: false,
      },
      deletedAt: {
        type: "date",
        required: false,
        defaultValue: null,
      },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24, // 1 day in seconds
    updateAge: 60 * 60 * 24, // 1 day in seconds
    cookieCache: {
      enabled: true,
      maxAge: 60 * 60 * 24, // 1 day in seconds
    },
  },
  trustedOrigins: [
    process.env.BETTER_AUTH_URL || "http://localhost:5000",
    envVars.FRONTEND_URL,
  ],
  advanced: {
    useSecureCookies: false,
    cookies: {
      state: {
        attributes: {
          sameSite: "lax",
          secure: false,
          httpOnly: true,
          path: "/",
        },
      },
      sessionToken: {
        attributes: {
          sameSite: "lax",
          secure: false,
          httpOnly: true,
          path: "/",
        },
      },
    },
  },
  plugins: [
    bearer(),
    emailOTP({
      overrideDefaultEmailVerification: true,
      expiresIn: 2 * 60, // 2 minutes in seconds
      otpLength: 6,

      async sendVerificationOTP({ email, otp, type }) {
        if (type === "email-verification") {
          const user = await prisma.user.findUnique({
            where: {
              email,
            },
          });
          
          if (user && !user.emailVerified) {
            sendEmail({
              to: email,
              subject: "Email verification",
              templateName: "email-verification",
              templateData: {
                name: user.name,
                appName: "HealthCare",
                expireTime: "2 minutes",
                otp,
              },
            });
          }
        }else if (type === "forget-password"){
          const user = await prisma.user.findUnique({
            where: {
              email,
            },
          });
          
          if (user) {
            sendEmail({
              to: email,
              subject: "Reset Password OTP",
              templateName: "reset-password",
              templateData: {
                name: user.name,
                appName: "HealthCare",
                expireTime: "2 minutes",
                otp,
              },
            });
          }
        }
      },
    }),
  ],
});
