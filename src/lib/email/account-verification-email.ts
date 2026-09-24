import { Email } from "./email.ts";

export class AccountVerificationEmail extends Email {
  private readonly name: string;
  private readonly token: string;

  constructor(appUrl: string, name: string, token: string) {
    super(appUrl);
    this.name = name;
    this.token = token;
  }

  get subject() {
    return "Verify your AMP CSR account";
  }

  protected content() {
    return {
      heading: "Your account is ready",
      paragraphs: [
        `${this.name}, your CSR account has been created. Verify this email address so we know it reached you.`,
      ],
      actionLabel: "Verify email",
      actionUrl: `${this.appUrl}/verify-email?token=${encodeURIComponent(this.token)}`,
      footnote: "If you did not create this account, you can ignore this email.",
    };
  }
}
