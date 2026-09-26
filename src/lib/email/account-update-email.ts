import { customerNoticeFootnote } from "./customer-recipient.ts";
import { NoticeEmail } from "./notice-email.ts";

export class AccountUpdateEmail extends NoticeEmail {
  constructor(appUrl: string, firstName: string, membershipId: string, changes: string[], sampleAddress = false) {
    super(
      appUrl,
      `Account details updated for ${membershipId}`,
      "Account details updated",
      [`Hi ${firstName}, these details on membership ${membershipId} were updated:`],
      customerNoticeFootnote(sampleAddress),
      changes,
    );
  }
}
