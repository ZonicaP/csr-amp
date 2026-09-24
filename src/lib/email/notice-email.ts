import { Email } from "./email.ts";

export class NoticeEmail extends Email {
  private readonly emailSubject: string;
  private readonly headingText: string;
  private readonly body: string[];
  private readonly note: string;
  private readonly items: string[];
  private readonly after: string[];

  private readonly showAction: boolean;

  constructor(
    appUrl: string,
    subject: string,
    heading: string,
    paragraphs: string[],
    footnote: string,
    bullets: string[] = [],
    closing: string[] = [],
    showAction = true,
  ) {
    super(appUrl);
    this.emailSubject = subject;
    this.headingText = heading;
    this.body = paragraphs;
    this.note = footnote;
    this.items = bullets;
    this.after = closing;
    this.showAction = showAction;
  }

  get subject() {
    return this.emailSubject;
  }

  protected content() {
    return {
      heading: this.headingText,
      paragraphs: this.body,
      bullets: this.items,
      closing: this.after,
      ...(this.showAction ? { actionLabel: "Open the portal", actionUrl: this.appUrl } : {}),
      footnote: this.note,
    };
  }
}
