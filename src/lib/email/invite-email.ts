import { Email } from "./email.ts";

export class InviteEmail extends Email {
  private readonly name: string;
  private readonly token: string;

  constructor(appUrl: string, name: string, token: string) {
    super(appUrl);
    this.name = name;
    this.token = token;
  }

  get subject() {
    return "You’re invited to the AMP CSR portal";
  }

  protected content() {
    return {
      heading: `Welcome, ${this.name}`,
      paragraphs: [
        "An admin invited you to the AMP customer service portal. Create your account to set a password and get started.",
      ],
      actionLabel: "Create account",
      actionUrl: `${this.appUrl}/signup?token=${encodeURIComponent(this.token)}`,
      footnote: "If you were not expecting this invite, you can ignore this email.",
    };
  }
}
