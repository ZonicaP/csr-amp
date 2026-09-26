import { openCallLink } from "@/lib/calls/call-service";
import { prisma } from "@/lib/prisma";
import { currentCsr, CsrError } from "@/lib/csr/csr-service";
import { hasPermission } from "@/lib/csr/permissions";
import { appUrl, createEmailService } from "@/lib/email/email-service";
import { NoticeEmail } from "@/lib/email/notice-email";
import type { SuggestedAction } from "@/lib/debug/account-issue";
import { parseOfferDiscount } from "@/lib/users/discount";

async function customerFor(membershipId: string) {
  const customer = await prisma.user.findFirst({
    where: { membershipId: { equals: membershipId, mode: "insensitive" } },
    select: { id: true, firstName: true, membershipId: true, status: true },
  });
  if (!customer) throw new CsrError("NOT_FOUND", "That customer could not be found");
  return customer;
}

async function planNames(userId: string) {
  const vehicles = await prisma.vehicle.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
    select: { subscriptions: { select: { planName: true } } },
  });
  return vehicles.flatMap((vehicle) => vehicle.subscriptions.map((plan) => plan.planName));
}

async function paidPurchases(userId: string) {
  return prisma.purchase.findMany({
    where: { userId, failureReason: null },
    select: { id: true, description: true, amount: true, purchasedAt: true },
  });
}

export async function runAccountAction(
  actorId: string,
  membershipId: string,
  action: SuggestedAction,
  input: { reason?: string; percent?: unknown; period?: unknown } = {},
) {
  const actor = await currentCsr(actorId);
  const link = await openCallLink(actorId);
  const customer = await customerFor(membershipId);
  const mail = createEmailService();
  const to = actor.email;

  if (action.type === "cancel-membership") {
    const cancellationReason = (input.reason ?? "").trim();
    if (!cancellationReason) throw new CsrError("INVALID", "Add a reason for the cancellation");
    if (!hasPermission(actor.roles, "subscriptions:cancel")) throw new CsrError("FORBIDDEN", "You do not have permission for this action");
    if (customer.status === "CANCELLED") throw new CsrError("CONFLICT", "This membership is already cancelled");
    const plans = await planNames(customer.id);
    await prisma.$transaction([
      prisma.subscription.updateMany({ where: { vehicle: { userId: customer.id }, status: "ACTIVE" }, data: { status: "CANCELLED" } }),
      prisma.user.update({ where: { id: customer.id }, data: { status: "CANCELLED" } }),
      prisma.customerEvent.create({
        data: { userId: customer.id, type: "PLAN_CANCELLED", summary: `Membership cancelled by CSR. ${cancellationReason}`, createdAt: new Date(), ...link },
      }),
      prisma.customerEvent.create({ data: { userId: customer.id, type: "ACCOUNT_CANCELLED", summary: "Account cancelled by CSR.", createdAt: new Date(Date.now() + 1000), ...link } }),
    ]);
    await mail.send(
      to,
      new NoticeEmail(
        appUrl(),
        `Membership ${customer.membershipId} cancelled`,
        "Membership cancelled",
        [
          `Hi ${customer.firstName}, membership ${customer.membershipId} has been cancelled.`,
          plans.length > 0 ? `Plan: ${plans.join(", ")}.` : "No active plan was on this membership.",
          `Reason: ${cancellationReason}`,
          "Washes on this membership will no longer start.",
        ],
        "This confirmation is delivered to the signed-in CSR for this project.",
      ),
    );
    return;
  }

  if (action.type === "reactivate-membership") {
    if (!hasPermission(actor.roles, "customers:update")) throw new CsrError("FORBIDDEN", "You do not have permission for this action");
    if (customer.status !== "CANCELLED") throw new CsrError("CONFLICT", "This membership is not cancelled");
    await prisma.$transaction([
      prisma.subscription.updateMany({ where: { vehicle: { userId: customer.id } }, data: { status: "ACTIVE" } }),
      prisma.user.update({ where: { id: customer.id }, data: { status: "ACTIVE" } }),
      prisma.customerEvent.create({ data: { userId: customer.id, type: "PLAN_STARTED", summary: "Membership reactivated by CSR.", createdAt: new Date(), ...link } }),
    ]);
    return;
  }

  if (action.type === "offer-discount") {
    if (!hasPermission(actor.roles, "customers:read")) throw new CsrError("FORBIDDEN", "You do not have permission for this action");
    if (customer.status === "CANCELLED") throw new CsrError("CONFLICT", "This membership is already cancelled");
    const offer = parseOfferDiscount(input.percent, input.period, actor.roles);
    if ("error" in offer) throw new CsrError("INVALID", offer.error);
    await mail.send(
      to,
      new NoticeEmail(
        appUrl(),
        `${offer.percent}% off for ${offer.label} for ${customer.membershipId}`,
        "Stay on your membership",
        [
          `Hi ${customer.firstName}, you can keep this membership at ${offer.percent}% off the current plan price for ${offer.label}.`,
          "Reply to this email if you want the discount applied.",
        ],
        "This offer email is delivered to the signed-in CSR for this project.",
      ),
    );
    await prisma.customerEvent.create({
      data: {
        userId: customer.id,
        type: "ACCOUNT_UPDATED",
        summary: `Discount offered: ${offer.percent}% off for ${offer.label}.`.slice(0, 500),
        createdAt: new Date(),
        ...link,
      },
    });
    return;
  }

  if (action.type === "email-plate-documents") {
    if (!hasPermission(actor.roles, "customers:update")) throw new CsrError("FORBIDDEN", "You do not have permission for this action");
    await prisma.customerEvent.create({
      data: { userId: customer.id, type: "ACCOUNT_UPDATED", summary: "Plate documents requested.", createdAt: new Date(), ...link },
    });
    const documentSubject = `Plate update ${customer.membershipId}`;
    await mail.send(
      to,
      new NoticeEmail(
        appUrl(),
        "Documents to update a license plate",
        "Update a license plate",
        [`Hi ${customer.firstName}, to change the plate on this membership we need:`],
        "This email is delivered to the signed-in CSR for this project.",
        ["A photo of the new plate", "The vehicle registration", "Proof the vehicle is yours"],
        [`Email those three documents to ${to} with the subject “${documentSubject}”.`],
        false,
      ),
    );
    return;
  }

  if (action.type === "refund-charge") {
    if (!hasPermission(actor.roles, "billing:resolve-overdue")) throw new CsrError("FORBIDDEN", "You do not have permission for this action");
    const paid = await paidPurchases(customer.id);
    const charge = paid.find((purchase) => purchase.id === action.purchaseId);
    const earlier = charge
      ? paid.find(
          (other) =>
            other.id !== charge.id &&
            Number(other.amount) === Number(charge.amount) &&
            charge.purchasedAt >= other.purchasedAt &&
            charge.purchasedAt.getTime() - other.purchasedAt.getTime() <= 2 * 24 * 60 * 60 * 1000,
        )
      : null;
    if (!charge || !earlier) throw new CsrError("CONFLICT", "A refund is only available on a second charge made within two days");
    await prisma.customerEvent.create({
      data: {
        userId: customer.id,
        type: "ACCOUNT_UPDATED",
        summary: `Refund requested for ${charge.description} ($${Number(charge.amount).toFixed(2)}).`.slice(0, 500),
        createdAt: new Date(),
        ...link,
      },
    });
    await mail.send(
      to,
      new NoticeEmail(
        appUrl(),
        `Refund ${charge.description} for ${customer.membershipId}`,
        "Refund requested",
        [`A refund was requested for the later ${charge.description} charge of $${Number(charge.amount).toFixed(2)}.`],
        "This email is delivered to the signed-in CSR. A live setup would send the refund to the card.",
      ),
    );
    return;
  }
}
