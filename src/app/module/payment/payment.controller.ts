import { Request, Response } from "express";
import { envVars } from "../../config/env";
import status from "http-status";
import { stripe } from "../../config/stripe.config";
import { catchAsync } from "../../shared/catchAsync";
import { paymentService } from "./payment.service";
import { sendResponse } from "../../shared/sendResponse";

/*********************************
 * Stripe Webhook Handler
 ********************************/
const handleStripeWebhookEvent = catchAsync(
  async (req: Request, res: Response) => {
    console.log("webhook hit...")
    const signature = req.headers["stripe-signature"];
    const webhookSecret = envVars.STRIPE_WEBHOOK_SECRET;

    console.log(signature, req.body)

    if (!signature || !webhookSecret) {
      console.error("Missing Stripe Signature or webhook secret");
      return res
        .status(status.BAD_REQUEST)
        .json({ message: "Missing Stripe Signature or webhook secret" });
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        signature,
        webhookSecret,
      );
    } catch (error) {
      console.error("Error processing stripe webhook", error);
      return res
        .status(status.BAD_REQUEST)
        .json({ message: "Error processing stripe webhook" });
    }

    try {
      const result = await paymentService.handleStripeWebhookEvent(event);

      sendResponse(res, {
        success: true,
        message: "Stripe webhook event processed successfully",
        statusCode: status.OK,
        data: result,
      });
    } catch (error) {
      console.error("Error handling Stripe webhook event", error);
      sendResponse(res, {
        success: false,
        message: "Error handling Stripe webhook event",
        statusCode: status.INTERNAL_SERVER_ERROR,
      });
    }
  },
);

export const paymentController = {
  handleStripeWebhookEvent,
};
