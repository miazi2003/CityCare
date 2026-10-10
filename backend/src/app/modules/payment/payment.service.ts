import type Stripe from "stripe";
import prisma from "../../lib/prisma";
import { stripe } from "../../lib/stripe";
import { config } from "../../config";
import { createNotification } from "../notification/notification.service";
import { createAuditLog } from "../auditLog/auditLog.service";

export const createPaymentSessionForServiceRequestIntoDB = async (
  serviceRequestId: string,
  citizenId: string
) => {
  const serviceRequest = await prisma.serviceRequest.findUnique({
    where: { id: serviceRequestId },
    include: {
      service: true,
      citizen: true,
    },
  });

  if (!serviceRequest) {
    throw new Error("Service request not found");
  }

  if (serviceRequest.citizenId !== citizenId) {
    throw new Error("You do not have permission to perform this action");
  }

  if (serviceRequest.status !== "PENDING_PAYMENT") {
    throw new Error("Service request is not pending payment");
  }

  const payment = await prisma.payment.upsert({
    where: { serviceRequestId: serviceRequest.id },
    update: {
      amount: serviceRequest.amount,
      currency: "usd",
      provider: "stripe",
      status: "PENDING",
    },
    create: {
      serviceRequestId: serviceRequest.id,
      citizenId,
      amount: serviceRequest.amount,
      currency: "usd",
      provider: "stripe",
      status: "PENDING",
    },
  });

  const unitAmountInCents = Math.round(Number(serviceRequest.amount) * 100);

  let checkoutUrl: string;
  let sessionId: string;

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      customer_email: serviceRequest.citizen.email,
      client_reference_id: serviceRequest.id,
      metadata: {
        serviceRequestId: serviceRequest.id,
        citizenId: serviceRequest.citizenId,
        paymentId: payment.id,
      },
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: serviceRequest.service.name,
              description: serviceRequest.service.description || undefined,
            },
            unit_amount: unitAmountInCents,
          },
          quantity: 1,
        },
      ],
      success_url: `${config.client_url}/citizen/service-requests/${serviceRequest.id}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${config.client_url}/citizen/service-requests/${serviceRequest.id}?payment=cancelled`,
    });

    if (!session.url && !session.id) {
      throw new Error("Failed to create Stripe Checkout session");
    }

    checkoutUrl = session.url || `https://checkout.stripe.com/c/pay/${session.id}`;
    sessionId = session.id;
  } catch (stripeError: any) {
    throw new Error(stripeError.message || "Failed to create payment checkout session");
  }

  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      transactionId: sessionId,
    },
  });

  return {
    checkoutUrl,
    sessionId,
  };
};

export const getPaymentStatusByServiceRequestFromDB = async (
  serviceRequestId: string,
  user: { id: string; role: string }
) => {
  const serviceRequest = await prisma.serviceRequest.findUnique({
    where: { id: serviceRequestId },
    include: {
      payment: true,
    },
  });

  if (!serviceRequest) {
    throw new Error("Service request not found");
  }

  if (user.role === "CITIZEN" && serviceRequest.citizenId !== user.id) {
    throw new Error("You do not have permission to perform this action");
  }

  if (!serviceRequest.payment) {
    throw new Error("Payment record not found");
  }

  return {
    id: serviceRequest.payment.id,
    amount: serviceRequest.payment.amount,
    currency: serviceRequest.payment.currency,
    provider: serviceRequest.payment.provider,
    transactionId: serviceRequest.payment.transactionId,
    status: serviceRequest.payment.status,
    createdAt: serviceRequest.payment.createdAt,
  };
};

export const processStripeWebhookFromDB = async (
  rawBody: Buffer | string,
  signature: string | undefined
) => {
  if (!signature) {
    throw new Error("Missing Stripe signature");
  }

  const event = stripe.webhooks.constructEvent(
    rawBody,
    signature,
    config.stripe_webhook_secret
  );

  if (
    event.type === "checkout.session.completed" ||
    event.type === "payment_intent.succeeded"
  ) {
    const sessionOrIntent = event.data.object as (Stripe.Checkout.Session | Stripe.PaymentIntent) & Record<string, any>;

    if (
      event.type === "checkout.session.completed" &&
      sessionOrIntent.payment_status !== "paid"
    ) {
      return { received: true, ignored: "Payment not completed" };
    }

    const serviceRequestId =
      sessionOrIntent.metadata?.serviceRequestId ||
      (sessionOrIntent as Stripe.Checkout.Session).client_reference_id;
    const transactionId =
      (sessionOrIntent as any).payment_intent ||
      sessionOrIntent.id;

    if (serviceRequestId) {
      let notifiedCitizenId: string | null = null;

      await prisma.$transaction(async (tx) => {
        const serviceRequest = await tx.serviceRequest.findUnique({
          where: { id: serviceRequestId },
        });

        if (!serviceRequest) {
          throw new Error(`Service request ${serviceRequestId} not found during webhook reconciliation`);
        }

        const sessionAmountTotal =
          sessionOrIntent.amount_total ||
          (sessionOrIntent as Stripe.PaymentIntent).amount_received ||
          (sessionOrIntent as Stripe.PaymentIntent).amount;
        const expectedAmountInCents = Math.round(Number(serviceRequest.amount) * 100);

        if (sessionAmountTotal && sessionAmountTotal !== expectedAmountInCents) {
          throw new Error(
            `Payment reconciliation failed: amount mismatch. Expected ${expectedAmountInCents} cents, received ${sessionAmountTotal} cents`
          );
        }

        const sessionCurrency = sessionOrIntent.currency?.toLowerCase();
        if (sessionCurrency && sessionCurrency !== "usd") {
          throw new Error(
            `Payment reconciliation failed: currency mismatch. Expected usd, received ${sessionCurrency}`
          );
        }

        const payment = await tx.payment.findUnique({
          where: { serviceRequestId },
        });

        if (
          payment &&
          payment.status === "PAID" &&
          serviceRequest.status === "PAID"
        ) {
          return;
        }

        if (payment) {
          if (payment.status !== "PAID") {
            await tx.payment.update({
              where: { id: payment.id },
              data: {
                status: "PAID",
                transactionId: transactionId || payment.transactionId,
              },
            });
          }
        } else {
          await tx.payment.create({
            data: {
              serviceRequestId,
              citizenId: serviceRequest.citizenId,
              amount: serviceRequest.amount,
              currency: "usd",
              provider: "stripe",
              transactionId,
              status: "PAID",
            },
          });
        }

        if (serviceRequest.status !== "PAID") {
          await tx.serviceRequest.update({
            where: { id: serviceRequestId },
            data: {
              status: "PAID",
            },
          });
          notifiedCitizenId = serviceRequest.citizenId;
        }
      });

      if (notifiedCitizenId) {
        await createNotification({
          userId: notifiedCitizenId,
          title: "Payment Successful",
          message: "Your payment for the municipal service request was successful.",
          type: "PAYMENT_SUCCESS",
        });

        await createAuditLog({
          userId: notifiedCitizenId,
          action: "PAYMENT",
          entity: "PAYMENT",
          entityId: serviceRequestId,
          description: "Verified Stripe payment processed successfully",
          metadata: {
            serviceRequestId,
            transactionId: transactionId || null,
          },
        });
      }
    }
  }

  return { received: true };
};
