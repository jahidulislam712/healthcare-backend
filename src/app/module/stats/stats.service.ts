import status from "http-status";
import { PaymentStatus, Role } from "../../../generated/prisma/enums";
import { IRequestUser } from "../../interfaces/requestUser.interface";
import { prisma } from "../../lib/prisma";
import AppError from "../../errorHelpers/appError";

/*********************************
 * Get Dashboard Stats Data
 ********************************/
const getDashboardStatsData = async (user: IRequestUser) => {
  let statsData;

  switch (user.role) {
    case "SUPER_ADMIN":
      statsData = getSuperAdminStatsData();
      break;
    case "ADMIN":
      statsData = getAdminStatsData();
      break;
    case "DOCTOR":
      statsData = getDoctorStatsData(user);
      break;
    case "PATIENT":
      statsData = getPatientStatsData(user);
      break;
    default:
      throw new AppError(status.BAD_REQUEST, "Invalid user role");
  }

  return statsData;
};

/*********************************
 * Get SUPER_ADMIN Stats Data
 ********************************/
const getSuperAdminStatsData = async () => {
  const superAdminCount = await prisma.user.count({
    where: {
      role: Role.SUPER_ADMIN,
    },
  });
  const adminCount = await prisma.admin.count();
  const doctorCount = await prisma.doctor.count();
  const patientCount = await prisma.patient.count();
  const userCount = await prisma.user.count();
  const totalRevenue = await prisma.payment.aggregate({
    _sum: {
      amount: true,
    },
    where: {
      status: PaymentStatus.PAID,
    },
  });

  return {
    superAdminCount,
    adminCount,
    doctorCount,
    patientCount,
    userCount,
    totalRevenue: totalRevenue._sum.amount,
    pieChartData: await getPieChartData(),
    barChartData: await getBarChartData(),
  };
};

/*********************************
 * Get ADMIN Stats Data
 ********************************/
const getAdminStatsData = async () => {
  const adminCount = await prisma.admin.count();
  const doctorCount = await prisma.doctor.count();
  const patientCount = await prisma.patient.count();
  const userCount = await prisma.user.count();
  const totalRevenue = await prisma.payment.aggregate({
    _sum: {
      amount: true,
    },
    where: {
      status: PaymentStatus.PAID,
    },
  });

  return {
    adminCount,
    doctorCount,
    patientCount,
    userCount,
    totalRevenue: totalRevenue._sum.amount,
    pieChartData: await getPieChartData(),
    barChartData: await getBarChartData(),
  };
};

/*********************************
 * Get DOCTOR Stats Data
 ********************************/
const getDoctorStatsData = async (user: IRequestUser) => {
  const doctor = await prisma.doctor.findUniqueOrThrow({
    where: {
      userId: user.sub,
    },
  });

  const reviewCount = await prisma.review.count({
    where: {
      doctorId: doctor.id,
    },
  });

  const myPatientCount = await prisma.appointment.groupBy({
    by: ["patientId"],
    _count: { id: true },
    where: {
      doctorId: doctor.id,
    },
  });

  const appointmentCount = await prisma.appointment.count({
    where: {
      doctorId: doctor.id,
    },
  });

  const totalRevenue = await prisma.payment.aggregate({
    _sum: {
      amount: true,
    },
    where: {
      status: PaymentStatus.PAID,
      appointment: {
        doctorId: doctor.id,
      },
    },
  });

  const appointmentStatusDistribution = await prisma.appointment.groupBy({
    by: ["status", "paymentStatus"],
    _count: {
      id: true,
    },
    where: {
      doctorId: doctor.id,
    },
  });

  const formattedAppointmentStatusDistribution =
    appointmentStatusDistribution.map(({ _count, paymentStatus, status }) => ({
      count: _count.id,
      status,
      paymentStatus,
    }));

  return {
    reviewCount,
    myPatientCount,
    appointmentCount,
    totalRevenue: totalRevenue._sum.amount,
    appointmentStatusDistribution: formattedAppointmentStatusDistribution,
  };
};

/*********************************
 * Get PATIENT Stats Data
 ********************************/
const getPatientStatsData = async (user: IRequestUser) => {
  const patient = await prisma.patient.findUniqueOrThrow({
    where: {
      userId: user.sub,
    },
  });

  const reviewCount = await prisma.review.count({
    where: {
      patientId: patient.id,
    },
  });

  const appointmentCount = await prisma.appointment.count({
    where: {
      patientId: patient.id,
    },
  });

  const appointmentStatusDistribution = await prisma.appointment.groupBy({
    by: ["status", "paymentStatus"],
    _count: {
      id: true,
    },
    where: {
      patientId: patient.id,
    },
  });

  const formattedAppointmentStatusDistribution =
    appointmentStatusDistribution.map(({ _count, status, paymentStatus }) => ({
      status,
      paymentStatus,
      count: _count.id,
    }));

  return {
    reviewCount,
    appointmentCount,
    appointmentStatusDistribution: formattedAppointmentStatusDistribution,
  };
};

/*********************************
 * Get PieChart Data
 ********************************/
const getPieChartData = async () => {
  const appointmentStatusDistribution = await prisma.appointment.groupBy({
    by: ["status", "paymentStatus"],
    _count: {
      id: true,
    },
  });

  const formattedAppointmentStatusDistribution =
    appointmentStatusDistribution.map(({ _count, status, paymentStatus }) => ({
      status,
      paymentStatus,
      count: _count.id,
    }));

  return formattedAppointmentStatusDistribution;
};

/*********************************
 * Get BarChart Data
 ********************************/
const getBarChartData = async () => {
  interface AppointmentCountByMonth {
    month: Date;
    count: bigint;
  }
  const appointmentCountByMonth: AppointmentCountByMonth[] =
    await prisma.$queryRaw`
        SELECT DATE_TRUNC('month', "createdAt") AS month,
        CAST(COUNT(*) AS INTEGER) AS count
        FROM "appointments"
        GROUP BY month
        ORDER BY month ASC;
    `;

  return appointmentCountByMonth;
};

export const statsService = {
  getDashboardStatsData,
};
