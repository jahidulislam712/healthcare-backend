import Stripe from "stripe";
import { prisma } from "../../lib/prisma";
import { PaymentStatus } from "../../../generated/prisma/enums";

const handleStripeWebhookEvent = async (event: Stripe.Event) => {
  
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const appointmentId = session.metadata?.appointmentId;
      const paymentId = session.metadata?.paymentId;

      console.log(session, "Session")

      if (!appointmentId || !paymentId) {
        console.error("Missing appointmentId or paymentId in session metadata");
        return {
          message: "Missing appointmentId or paymentId in session metadata",
        };
      }

      const appointment = await prisma.appointment.findUnique({
        where: {
          id: appointmentId,
        },
      });

      if (!appointment) {
        console.error(`Appointment with id ${appointmentId} not found`);
        return { message: `Appointment with id ${appointmentId} not found` };
      }

      // update appointment payment status
      await prisma.$transaction(async (tx) => {
        await tx.appointment.update({
          where: { id: appointmentId },
          data: {
            paymentStatus:
              session.payment_status === "paid"
                ? PaymentStatus.PAID
                : PaymentStatus.UNPAID,
          },
        });
      });

      // update payment data
      await prisma.$transaction(async (tx) => {
        await tx.payment.update({
          where: { id: paymentId },
          data: {
            stripeEventId: event.id,
            status:
              session.payment_status === "paid"
                ? PaymentStatus.PAID
                : PaymentStatus.UNPAID,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            paymentGateWayDate: session as any,
          },
        });
      });

      console.log(
        `Processed checkout.session.completed for appointment ${appointmentId} and payment ${paymentId}`,
      );
      break;
    }

    case "checkout.session.expired": {
      const session = event.data.object;

      console.log(
        `Checkout session ${session.id} expired. Marking associated payment as failed.`,
      );
      break;
    }
    case "payment_intent.payment_failed": {
      const session = event.data.object;

      console.log(
        `Payment intent ${session.id} failed. Marking associated payment as failed.`,
      );
      break;
    }

    default:
      console.log(`Unhandled session ${event.type}`);
  }

  return {message : `Webhook Event ${event.id} processed successfully`}
};

export const paymentService = {
  handleStripeWebhookEvent,
};
