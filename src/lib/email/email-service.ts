import { Email } from "./email.ts";
import { createSmtpTransport, type EmailTransport } from "./smtp-transport.ts";

export class EmailService {
  private readonly transport: EmailTransport;

  constructor(transport: EmailTransport) {
    this.transport = transport;
  }

  send(to: string, email: Email) {
    return this.transport.send({ to, ...email.render() });
  }
}

export function appUrl() {
  return (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

export function createEmailService() {
  return new EmailService(createSmtpTransport());
}
