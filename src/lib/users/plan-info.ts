import { washPlans, type WashPlan } from "@/lib/users/wash-plans";

const detail: Record<WashPlan, string> = {
  "Unlimited Wash":
    "Sold on the vehicle as Unlimited Wash. AMP describes unlimited memberships as the recurring plan a member keeps. The public site does not list extra wash services for this name.",
  "Basic Wash":
    "Sold on the vehicle as Basic Wash. AMP’s public site does not list the washes or extras in this plan. The operator sets the price and benefits for the tier.",
  "The Works":
    "Sold on the vehicle as The Works. AMP’s public site does not publish what this plan includes. Do not promise add-ons that are not already on the account.",
};

export const planDetails = washPlans.map((name) => ({ name, detail: detail[name] }));

export const planInfoNote =
  "For any of these plans, AMP’s site says a membership can be paused and resumed, upgraded or downgraded, and the app can show how much the member has saved with the plan. Those are membership tools, not a service menu for one plan name.";
