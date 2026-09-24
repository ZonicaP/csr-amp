import { NoticeEmail } from "./notice-email.ts";

export class SubscriptionChangeEmail extends NoticeEmail {
  constructor(appUrl: string, firstName: string, membershipId: string, change: string) {
    super(
      appUrl,
      `Vehicle plan updated for ${membershipId}`,
      "Vehicle plan updated",
      [`Hi ${firstName}, a plan on membership ${membershipId} was changed:`],
      "This email is delivered to the signed-in CSR for this project.",
      [change],
    );
  }
}
