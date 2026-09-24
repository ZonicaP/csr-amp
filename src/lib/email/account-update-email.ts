import { NoticeEmail } from "./notice-email.ts";

export class AccountUpdateEmail extends NoticeEmail {
  constructor(appUrl: string, firstName: string, membershipId: string, changes: string[]) {
    super(
      appUrl,
      `Account details updated for ${membershipId}`,
      "Account details updated",
      [`Hi ${firstName}, these details on membership ${membershipId} were updated:`],
      "This email is delivered to the signed-in CSR for this project.",
      changes,
    );
  }
}
