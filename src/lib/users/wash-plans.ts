export const washPlans = ["Unlimited Wash", "Basic Wash", "The Works"] as const;

export type WashPlan = (typeof washPlans)[number];

export function isWashPlan(value: string): value is WashPlan {
  return (washPlans as readonly string[]).includes(value);
}

export function plansAvailableToAdd(activePlanNames: readonly string[]) {
  const active = new Set(activePlanNames);
  return washPlans.filter((plan) => !active.has(plan));
}
