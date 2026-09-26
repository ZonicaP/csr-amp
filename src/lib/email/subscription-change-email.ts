import { customerNoticeFootnote } from "./customer-recipient.ts";
import { NoticeEmail } from "./notice-email.ts";

export class SubscriptionChangeEmail extends NoticeEmail {
  constructor(appUrl: string, firstName: string, membershipId: string, change: string, sampleAddress = false) {
    super(
      appUrl,
      `Vehicle plan updated for ${membershipId}`,
      "Vehicle plan updated",
      [`Hi ${firstName}, a plan on membership ${membershipId} was changed:`],
      customerNoticeFootnote(sampleAddress),
      [change],
    );
  }
}
