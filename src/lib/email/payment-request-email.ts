import { Email } from "./email.ts";

export class PaymentRequestEmail extends Email {
  private readonly customerName: string;
  private readonly description: string;
  private readonly amount: string;
  private readonly reason: string;
  private readonly membershipId: string;

  constructor(appUrl: string, customerName: string, description: string, amount: string, reason: string, membershipId: string) {
    super(appUrl);
    this.customerName = customerName;
    this.description = description;
    this.amount = amount;
    this.reason = reason;
    this.membershipId = membershipId;
  }

  get subject() {
    return `Payment due for ${this.description}`;
  }

  protected content() {
    return {
      heading: "Payment due",
      paragraphs: [
        `Hi ${this.customerName}, a payment for your membership did not go through. ${this.reason}.`,
        "The amount below is what is still due.",
      ],
      invoice: { description: this.description, amount: this.amount },
      actionLabel: `Pay ${this.amount}`,
      actionUrl: `${this.appUrl}/pay/${encodeURIComponent(this.membershipId)}`,
      footnote: "This link opens a mock invoice. In a live setup it would open the payment page.",
    };
  }
}
