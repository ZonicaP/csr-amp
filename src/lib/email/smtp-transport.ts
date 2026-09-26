import path from "node:path";
import nodemailer, { type Transporter } from "nodemailer";
import type { RenderedEmail } from "./email.ts";

const logoPath = path.join(process.cwd(), "public", "amp-logo-hires.png");

export class EmailDeliveryError extends Error {
  readonly brand = "email-delivery" as const;
}

export type OutboundEmail = RenderedEmail & { to: string };

export interface EmailTransport {
  send(message: OutboundEmail): Promise<void>;
}

export class SmtpEmailTransport implements EmailTransport {
  private readonly transporter: Transporter;
  private readonly from: string;

  constructor(transporter: Transporter, from: string) {
    this.transporter = transporter;
    this.from = from;
  }

  async send(message: OutboundEmail) {
    try {
      await this.transporter.sendMail({
        from: this.from,
        to: message.to,
        subject: message.subject,
        html: message.html,
        text: message.text,
        attachments: [
          {
            filename: "amp-logo.png",
            path: logoPath,
            cid: "amp-logo",
          },
        ],
      });
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Unknown mail error";
      throw new EmailDeliveryError(`The email could not be sent. ${detail}`);
    }
  }
}

export function createSmtpTransport(): SmtpEmailTransport {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  const from = process.env.EMAIL_FROM;
  const port = Number(process.env.SMTP_PORT ?? "587");
  if (!host || !user || !pass || !from || Number.isNaN(port)) {
    throw new EmailDeliveryError("Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, and EMAIL_FROM to send email.");
  }
  return new SmtpEmailTransport(
    nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    }),
    from,
  );
}
