import { openCallLink } from "@/lib/calls/call-service";
import { prisma } from "@/lib/prisma";
import { currentCsr, CsrError } from "@/lib/csr/csr-service";
import { hasPermission } from "@/lib/csr/permissions";
import { SubscriptionChangeEmail } from "@/lib/email/subscription-change-email";
import { appUrl, createEmailService } from "@/lib/email/email-service";
import { isWashPlan } from "@/lib/users/wash-plans";

type VehicleRecord = {
  id: string;
  year: number | null;
  make: string | null;
  model: string | null;
  licensePlate: string | null;
};

export type SubscriptionChange =
  | { type: "add"; vehicleId: string; planName: string }
  | { type: "remove"; subscriptionId: string }
  | { type: "transfer"; subscriptionId: string; destinationVehicleId: string };

function vehicleLabel(vehicle: VehicleRecord) {
  const name = [vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(" ") || "Vehicle";
  return vehicle.licensePlate ? `${name} (${vehicle.licensePlate})` : name;
}

const vehicleSelect = { id: true, year: true, make: true, model: true, licensePlate: true } as const;

async function membership(membershipId: string) {
  const customer = await prisma.user.findFirst({
    where: { membershipId: { equals: membershipId, mode: "insensitive" } },
    select: {
      id: true,
      firstName: true,
      membershipId: true,
      status: true,
      vehicles: {
        orderBy: { createdAt: "asc" },
        select: {
          ...vehicleSelect,
          subscriptions: { select: { id: true, planName: true, status: true } },
        },
      },
    },
  });
  if (!customer) throw new CsrError("NOT_FOUND", "That customer could not be found");
  return customer;
}

export async function listMembershipVehicles(actorId: string, membershipId: string) {
  const actor = await currentCsr(actorId);
  if (!hasPermission(actor.roles, "customers:read")) {
    throw new CsrError("FORBIDDEN", "You do not have permission for this action");
  }
  const customer = await prisma.user.findFirst({
    where: { membershipId: { equals: membershipId, mode: "insensitive" } },
    select: {
      membershipId: true,
      vehicles: { orderBy: { createdAt: "asc" }, select: vehicleSelect },
    },
  });
  if (!customer) throw new CsrError("NOT_FOUND", "That customer could not be found");
  return {
    membershipId: customer.membershipId,
    vehicles: customer.vehicles.map((vehicle) => ({ id: vehicle.id, label: vehicleLabel(vehicle) })),
  };
}

export async function runSubscriptionChange(actorId: string, membershipId: string, action: SubscriptionChange) {
  const actor = await currentCsr(actorId);
  const link = await openCallLink(actorId);
  const customer = await membership(membershipId);

  if (action.type === "add") {
    if (!hasPermission(actor.roles, "customers:update")) throw new CsrError("FORBIDDEN", "You do not have permission for this action");
    if (!isWashPlan(action.planName)) throw new CsrError("INVALID", "Choose Unlimited Wash, Basic Wash, or The Works");
    if (customer.status === "CANCELLED") throw new CsrError("CONFLICT", "Reactivate the membership before adding a plan");
    const vehicle = customer.vehicles.find((item) => item.id === action.vehicleId);
    if (!vehicle) throw new CsrError("NOT_FOUND", "That vehicle could not be found");
    const current = vehicle.subscriptions.filter((plan) => plan.status === "ACTIVE");
    if (current.some((plan) => plan.planName === action.planName)) {
      throw new CsrError("CONFLICT", "That plan is already on this vehicle");
    }
    const label = vehicleLabel(vehicle);
    const summary = current.length
      ? `${current.map((plan) => plan.planName).join(", ")} replaced by ${action.planName} on ${label}.`
      : `${action.planName} added on ${label}.`;
    await prisma.$transaction([
      ...current.map((plan) => prisma.subscription.update({ where: { id: plan.id }, data: { status: "CANCELLED" } })),
      prisma.subscription.create({ data: { vehicleId: vehicle.id, planName: action.planName, status: "ACTIVE", startedAt: new Date() } }),
      prisma.customerEvent.create({ data: { userId: customer.id, type: "PLAN_STARTED", summary, createdAt: new Date(), ...link } }),
    ]);
    await notify(actor.email, customer.firstName, customer.membershipId, summary);
    return;
  }

  const subscription = customer.vehicles.flatMap((vehicle) => vehicle.subscriptions.map((plan) => ({ ...plan, vehicle }))).find((plan) => plan.id === ("subscriptionId" in action ? action.subscriptionId : ""));
  if (!subscription) throw new CsrError("NOT_FOUND", "That plan could not be found");
  if (subscription.status !== "ACTIVE") throw new CsrError("CONFLICT", "That plan is not active");

  if (action.type === "remove") {
    if (!hasPermission(actor.roles, "subscriptions:cancel")) throw new CsrError("FORBIDDEN", "You do not have permission for this action");
    const summary = `${subscription.planName} removed from ${vehicleLabel(subscription.vehicle)}.`;
    await prisma.$transaction([
      prisma.subscription.update({ where: { id: subscription.id }, data: { status: "CANCELLED" } }),
      prisma.customerEvent.create({ data: { userId: customer.id, type: "PLAN_CANCELLED", summary, createdAt: new Date(), ...link } }),
    ]);
    await notify(actor.email, customer.firstName, customer.membershipId, summary);
    return;
  }

  if (!hasPermission(actor.roles, "subscriptions:transfer")) throw new CsrError("FORBIDDEN", "You do not have permission for this action");
  if (action.destinationVehicleId === subscription.vehicle.id) throw new CsrError("INVALID", "Choose a different vehicle");
  const destination = await prisma.vehicle.findUnique({
    where: { id: action.destinationVehicleId },
    select: {
      ...vehicleSelect,
      user: { select: { id: true, firstName: true, membershipId: true, status: true } },
      subscriptions: { where: { status: "ACTIVE", planName: subscription.planName }, select: { id: true } },
    },
  });
  if (!destination) throw new CsrError("NOT_FOUND", "That vehicle could not be found");
  if (destination.user.status === "CANCELLED") throw new CsrError("CONFLICT", "That membership is cancelled");
  if (destination.subscriptions.length > 0) throw new CsrError("CONFLICT", "That vehicle already has this plan");
  const summary = `${subscription.planName} moved from ${vehicleLabel(subscription.vehicle)} on ${customer.membershipId} to ${vehicleLabel(destination)} on ${destination.user.membershipId}.`.slice(0, 500);
  const events = [customer.id, destination.user.id]
    .filter((userId, index, ids) => ids.indexOf(userId) === index)
    .map((userId) => prisma.customerEvent.create({ data: { userId, type: "ACCOUNT_UPDATED", summary, createdAt: new Date(), ...link } }));
  await prisma.$transaction([
    prisma.subscription.update({ where: { id: subscription.id }, data: { vehicleId: destination.id } }),
    ...events,
  ]);
  await notify(actor.email, customer.firstName, customer.membershipId, summary);
  if (destination.user.id !== customer.id) {
    await notify(actor.email, destination.user.firstName, destination.user.membershipId, summary);
  }
}

function notify(to: string, firstName: string, membershipId: string, change: string) {
  return createEmailService().send(to, new SubscriptionChangeEmail(appUrl(), firstName, membershipId, change));
}
