export type EmailContent = {
  heading: string;
  paragraphs: string[];
  actionLabel: string;
  actionUrl: string;
  footnote: string;
};

export type RenderedEmail = {
  subject: string;
  html: string;
  text: string;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function layout(content: EmailContent) {
  const paragraphs = content.paragraphs
    .map(
      (paragraph) =>
        `<p style="margin:0 0 16px;color:#717680;font-size:16px;line-height:1.5;">${escapeHtml(paragraph)}</p>`,
    )
    .join("");
  const logo = "cid:amp-logo";
  return `<!DOCTYPE html>
<html lang="en">
  <body style="margin:0;padding:0;background:#F5FAFF;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F5FAFF;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#FDFDFD;border:1px solid #E5E7EB;border-radius:16px;padding:32px 28px;">
            <tr>
              <td>
                <img src="${logo}" alt="AMP" width="168" style="display:block;width:168px;height:auto;border:0;" />
                <h1 style="margin:28px 0 12px;color:#003264;font-size:32px;font-weight:300;line-height:1.2;letter-spacing:-0.02em;font-family:Manrope,system-ui,sans-serif;">${escapeHtml(content.heading)}</h1>
                <div style="font-family:Manrope,system-ui,sans-serif;">${paragraphs}</div>
                <table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 20px;">
                  <tr>
                    <td align="center" bgcolor="#0B75E1" style="border-radius:40px;">
                      <a href="${escapeHtml(content.actionUrl)}" style="display:inline-block;padding:14px 28px;color:#FFFFFF;font-family:Manrope,system-ui,sans-serif;font-size:16px;font-weight:600;text-decoration:none;">${escapeHtml(content.actionLabel)}</a>
                    </td>
                  </tr>
                </table>
                <p style="margin:0;color:#717680;font-size:14px;line-height:1.45;font-family:Manrope,system-ui,sans-serif;">${escapeHtml(content.footnote)}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export abstract class Email {
  protected readonly appUrl: string;

  constructor(appUrl: string) {
    this.appUrl = appUrl;
  }

  abstract get subject(): string;

  protected abstract content(): EmailContent;

  render(): RenderedEmail {
    const content = this.content();
    const text = [content.heading, ...content.paragraphs, `${content.actionLabel}: ${content.actionUrl}`, content.footnote].join("\n\n");
    return { subject: this.subject, html: layout(content), text };
  }
}
