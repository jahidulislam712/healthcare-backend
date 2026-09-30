import { v7 as uuidv7 } from "uuid";
import { IRequestUser } from "../../interfaces/requestUser.interface";
import { prisma } from "../../lib/prisma";
import { IBookAppointmentPayload } from "./appointment.interface";
import { stripe } from "../../config/stripe.config";
import { envVars } from "../../config/env";

/*********************************
 * Book Appointment
 ********************************/
const bookAppointment = async (user: IRequestUser, payload: IBookAppointmentPayload) => {
  const {doctorId, scheduleId} = payload

  // check patient
  const patient = await prisma.patient.findUniqueOrThrow({
    where: {
      userId: user.sub
    }
  })

  // check doctor
  const doctor = await prisma.doctor.findUniqueOrThrow({
    where: {
      id: doctorId
    }
  })

  // check schedule
  const schedule = await prisma.schedule.findUniqueOrThrow({
    where: {
      id: scheduleId
    }
  })

  // check doctorSchedule
  await prisma.doctorSchedules.findUniqueOrThrow({
    where: {
      doctorId_scheduleId: {
        doctorId: doctor.id,
        scheduleId: schedule.id
      }
    }
  })

  const videoCallingId = String(uuidv7())

  const result = await prisma.$transaction(async (tx) => {
    // create appointment
    const appointment = await tx.appointment.create({
      data:{
        patientId: patient.id,
        doctorId,
        scheduleId,
        videoCallingId
      }
    })

    // update doctorSchedule
    await tx.doctorSchedules.update({
      where: {
        doctorId_scheduleId:{
          doctorId, scheduleId
        }
      },
      data:{
        isBooked: true
      }
    })

    const transactionId = String(uuidv7())
    // create payment
    const payment = await tx.payment.create({
      data: {
        transactionId,
        amount: doctor.appointmentFee,
        appointmentId: appointment.id
      }
    })

    // Stripe checkout
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: "payment",
      line_items: [
        {
          price_data:{
            currency: "bdt",
            product_data: {
              name: `Appointment with Dr. ${doctor.name}`
            },
            unit_amount: doctor.appointmentFee * 100
          },
          quantity: 1
        }
      ],
      metadata: {
        appointmentId: appointment.id,
        paymentId: payment.id
      },
      success_url: `${envVars.FRONTEND_URL}/dashboard/payment/payment-success`,
      cancel_url: `${envVars.FRONTEND_URL}/dashboard/appointments`
    })

    return {
      appointment,
      payment,
      paymentUrl: session.url
    }
  })
  
  return {
    appointment: result.appointment,
    payment: result.payment,
    paymentUrl: result.paymentUrl,
  }
  
};


export const appointmentService = {
  bookAppointment
};
