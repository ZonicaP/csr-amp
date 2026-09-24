import { Email } from "./email.ts";

export class NoticeEmail extends Email {
  private readonly emailSubject: string;
  private readonly headingText: string;
  private readonly body: string[];
  private readonly note: string;

  constructor(appUrl: string, subject: string, heading: string, paragraphs: string[], footnote: string) {
    super(appUrl);
    this.emailSubject = subject;
    this.headingText = heading;
    this.body = paragraphs;
    this.note = footnote;
  }

  get subject() {
    return this.emailSubject;
  }

  protected content() {
    return {
      heading: this.headingText,
      paragraphs: this.body,
      actionLabel: "Open the portal",
      actionUrl: this.appUrl,
      footnote: this.note,
    };
  }
}
