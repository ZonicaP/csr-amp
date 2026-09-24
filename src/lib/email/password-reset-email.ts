import { Email } from "./email.ts";

export class PasswordResetEmail extends Email {
  private readonly name: string;
  private readonly token: string;

  constructor(appUrl: string, name: string, token: string) {
    super(appUrl);
    this.name = name;
    this.token = token;
  }

  get subject() {
    return "Reset your AMP CSR password";
  }

  protected content() {
    return {
      heading: "Choose a new password",
      paragraphs: [`${this.name}, use the button below to choose a new password. This link expires in one hour.`],
      actionLabel: "Reset password",
      actionUrl: `${this.appUrl}/reset-password?token=${encodeURIComponent(this.token)}`,
      footnote: "If you did not ask for a reset, you can ignore this email. Your password will stay the same.",
    };
  }
}
