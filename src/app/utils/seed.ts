import { Role } from "../../generated/prisma/enums";
import { envVars } from "../config/env";
import { auth } from "../lib/auth";
import { prisma } from "../lib/prisma";

export const seedSuperAdmin = async () => {
  const superAdmin = await prisma.user.findFirst({
    where: {
      role: Role.SUPER_ADMIN,
    },
    select: {
      id: true,
    },
  });

  if (superAdmin) {
    console.log("Super Admin already exists.");
    return;
  }

  const data = await auth.api.signUpEmail({
    body: {
      name: "Super Admin",
      email: envVars.SUPER_ADMIN_EMAIL,
      password: envVars.SUPER_ADMIN_PASS,
      role: Role.SUPER_ADMIN,
      needPasswordChange: false,
      rememberMe: false,
    },
  });

  try {
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: data.user.id },
        data: {
          emailVerified: true,
        },
      });

      await tx.admin.create({
        data: {
          name: data.user.name,
          email: data.user.email,
          userId: data.user.id,
        },
      });
    });
    console.log("Super Admin Created", data);
  } catch (error) {
    console.log("Error creating super admin", error);

    try {
      await prisma.user.delete({
        where: { id: data.user.id },
      });
    } catch (error) {
      console.error("Failed to clean up Super Admin user.", error);
    }
  }
};
